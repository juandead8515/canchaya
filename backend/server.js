const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;
const MODELO = "gemini-2.5-flash";
const FRONTEND = path.join(__dirname, "..", "frontend");
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8"
};
const HORARIOS = ["08:00", "10:00", "14:00", "18:00", "20:00"];
const CANCHAS_IDS = [1, 2, 3];

class ErrorIA extends Error {
  constructor(mensaje, status = 500) {
    super(mensaje);
    this.status = status;
  }
}

function instrucciones() {
  const hoy = new Date().toISOString().slice(0, 10);
  return `Eres el asistente virtual de CanchaYa, una plataforma para reservar canchas deportivas.
Canchas: 1 = Fútbol 5, 2 = Baloncesto, 3 = Voleibol.
Horarios disponibles: ${HORARIOS.join(", ")}.
Hoy es ${hoy}. Convierte fechas relativas (mañana, el viernes) a formato AAAA-MM-DD.
Responde siempre en español y de forma breve.
Responde SOLO con un objeto JSON con esta forma:
{"respuesta": "texto para el usuario", "reserva": {"canchaId": número o null, "fecha": "AAAA-MM-DD" o null, "hora": "HH:MM" o null}}
Si falta algún dato, déjalo en null y pregúntalo en la respuesta. No escribas nada fuera del JSON.`;
}

function sendJSON(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    let datos = "";
    req.on("data", parte => {
      datos += parte;
      if (datos.length > 10000) {
        req.destroy();
        reject(new ErrorIA("La solicitud es demasiado grande.", 413));
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(datos || "{}"));
      } catch {
        reject(new ErrorIA("El cuerpo de la solicitud no es JSON válido.", 400));
      }
    });
  });
}

async function consultarIA(mensaje) {
  if (!API_KEY) {
    throw new ErrorIA("Falta configurar GEMINI_API_KEY en el servidor.", 500);
  }

  let res;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": API_KEY
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: instrucciones() }] },
          contents: [{ role: "user", parts: [{ text: mensaje }] }],
          generationConfig: {
            maxOutputTokens: 400,
            responseMimeType: "application/json"
          }
        }),
        signal: AbortSignal.timeout(15000)
      }
    );
  } catch (err) {
    if (err.name === "TimeoutError") {
      throw new ErrorIA("El servicio de IA tardó demasiado en responder. Intenta de nuevo.", 504);
    }
    throw new ErrorIA("No hay conexión con el servicio de IA. Revisa tu Internet e intenta de nuevo.", 503);
  }

  if (!res.ok) {
    const detalle = await res.text();

    if (res.status === 403 || (res.status === 400 && /API key/i.test(detalle))) {
      throw new ErrorIA("Error de autenticación: la clave de Gemini no es válida. Revisa GEMINI_API_KEY.", 401);
    }
    if (res.status === 429) {
      throw new ErrorIA("Se alcanzó el límite de uso gratuito de Gemini. Espera un momento y reintenta.", 429);
    }
    if (res.status >= 500) {
      throw new ErrorIA("El servicio de IA no está disponible en este momento.", 503);
    }
    throw new ErrorIA(`Error inesperado del servicio de IA (código ${res.status}).`, 502);
  }

  const data = await res.json();
  const texto = (data.candidates?.[0]?.content?.parts || [])
    .map(p => p.text || "")
    .join("")
    .trim();

  if (!texto) {
    throw new ErrorIA("El servicio no devolvió contenido utilizable.", 502);
  }
  return texto;
}

function extraerJSON(texto) {
  const limpio = texto.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(limpio);
  } catch {
    return null;
  }
}

function limpiarReserva(r) {
  const salida = { canchaId: null, fecha: null, hora: null };
  if (r && CANCHAS_IDS.includes(Number(r.canchaId))) salida.canchaId = Number(r.canchaId);
  if (r && typeof r.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.fecha)) salida.fecha = r.fecha;
  if (r && HORARIOS.includes(r.hora)) salida.hora = r.hora;
  return salida;
}

async function manejarAsistente(req, res) {
  try {
    const body = await leerCuerpo(req);
    const mensaje = typeof body.mensaje === "string" ? body.mensaje.trim() : "";

    if (mensaje.length < 1 || mensaje.length > 500) {
      throw new ErrorIA("El mensaje debe tener entre 1 y 500 caracteres.", 400);
    }

    const texto = await consultarIA(mensaje);
    const resultado = extraerJSON(texto);

    if (!resultado) {
      throw new ErrorIA("No se pudo interpretar la respuesta del servicio. Intenta de nuevo.", 502);
    }

    sendJSON(res, 200, {
      respuesta: String(resultado.respuesta || "").slice(0, 1000),
      reserva: limpiarReserva(resultado.reserva)
    });
  } catch (err) {
    const status = err instanceof ErrorIA ? err.status : 500;
    sendJSON(res, status, { error: err.message || "Error interno del servidor." });
  }
}

function servirEstatico(req, res) {
  const ruta = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const archivo = path.normalize(path.join(FRONTEND, ruta));

  if (!archivo.startsWith(FRONTEND)) {
    res.writeHead(403);
    return res.end();
  }

  fs.readFile(archivo, (err, contenido) => {
    if (err) {
      res.writeHead(404);
      return res.end("No encontrado");
    }
    res.writeHead(200, { "Content-Type": TIPOS[path.extname(archivo)] || "application/octet-stream" });
    res.end(contenido);
  });
}

http
  .createServer((req, res) => {
    if (req.method === "POST" && req.url === "/api/asistente") return manejarAsistente(req, res);
    if (req.method === "GET") return servirEstatico(req, res);
    res.writeHead(405);
    res.end();
  })
  .listen(PORT, () => console.log(`CanchaYa en http://localhost:${PORT}`));
(function () {
  const widget = document.createElement("div");
  widget.id = "asistente";
  widget.innerHTML = `
    <div id="asistente-caja" class="asistente-caja oculto">
      <div class="asistente-header">Asistente CanchaYa</div>
      <div id="asistente-mensajes" class="asistente-mensajes">
        <div class="msg bot">¡Hola! Dime qué cancha quieres, la fecha y la hora, y te ayudo a reservar.</div>
      </div>
      <form id="asistente-form" class="asistente-form">
        <input id="asistente-input" type="text" maxlength="500" placeholder="Ej: fútbol mañana a las 6 pm">
        <button type="submit" class="btn btn-small">Enviar</button>
      </form>
    </div>
    <button id="asistente-toggle" class="btn asistente-btn">💬 Asistente</button>
  `;
  document.body.appendChild(widget);

  const caja = document.getElementById("asistente-caja");
  const mensajes = document.getElementById("asistente-mensajes");
  let reservaPendiente = null;
  let ultimoMensaje = "";

  function agregar(texto, clase) {
    const div = document.createElement("div");
    div.className = "msg " + clase;
    div.textContent = texto;
    mensajes.appendChild(div);
    mensajes.scrollTop = mensajes.scrollHeight;
    return div;
  }

  function mostrarMensajeFormulario() {
    const contenedor = document.getElementById("mensajes");
    if (contenedor) {
      contenedor.innerHTML = `<div class="alerta alerta-ok">Datos cargados por el asistente. Completa tu nombre y correo para confirmar.</div>`;
    }
  }

  function aplicarReserva() {
    const form = document.getElementById("form-reserva");
    if (!reservaPendiente || !form) return;

    const r = reservaPendiente;
    if (r.canchaId) form.canchaId.value = r.canchaId;
    if (r.fecha) form.fecha.value = r.fecha;
    if (r.hora) form.hora.value = r.hora;

    reservaPendiente = null;
    mostrarMensajeFormulario();
  }

  function mostrarBotonUsar() {
    const boton = document.createElement("button");
    boton.className = "btn btn-small";
    boton.textContent = "Usar estos datos en la reserva";
    boton.onclick = () => {
      if (location.hash === "#/reservar") {
        aplicarReserva();
      } else {
        location.hash = "#/reservar";
      }
      boton.remove();
    };
    mensajes.appendChild(boton);
    mensajes.scrollTop = mensajes.scrollHeight;
  }

  function mostrarError(texto, conReintento) {
    agregar(texto, "error");
    if (!conReintento) return;

    const boton = document.createElement("button");
    boton.className = "btn btn-small";
    boton.textContent = "Reintentar";
    boton.onclick = () => {
      boton.remove();
      enviarConsulta(ultimoMensaje);
    };
    mensajes.appendChild(boton);
    mensajes.scrollTop = mensajes.scrollHeight;
  }

  async function enviarConsulta(texto) {
    ultimoMensaje = texto;
    const pendiente = agregar("Pensando...", "bot pendiente");

    try {
      const res = await fetch("/api/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: texto })
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      pendiente.remove();

      if (!res.ok) {
        mostrarError(data.error || "Error desconocido del servidor.", true);
        return;
      }

      agregar(data.respuesta, "bot");

      const r = data.reserva;
      if (r && (r.canchaId || r.fecha || r.hora)) {
        reservaPendiente = r;
        mostrarBotonUsar();
      }
    } catch (err) {
      pendiente.remove();
      if (err instanceof TypeError) {
        mostrarError("No hay conexión con el servidor. Verifica que esté ejecutándose con: node backend\\server.js", true);
      } else {
        mostrarError("Ocurrió un error inesperado: " + err.message, true);
      }
    }
  }

  document.getElementById("asistente-toggle").addEventListener("click", () => {
    caja.classList.toggle("oculto");
  });

  document.getElementById("asistente-form").addEventListener("submit", e => {
    e.preventDefault();
    const input = document.getElementById("asistente-input");
    const texto = input.value.trim();

    if (!texto) {
      agregar("Escribe tu solicitud antes de enviar, por ejemplo: fútbol mañana a las 6 pm.", "error");
      return;
    }

    agregar(texto, "usuario");
    input.value = "";
    enviarConsulta(texto);
  });

  document.addEventListener("vistaRenderizada", aplicarReserva);
})();

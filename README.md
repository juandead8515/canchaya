# CanchaYa

Plataforma web para consultar disponibilidad y reservar canchas deportivas, con un asistente virtual basado en inteligencia artificial.

## Integrantes
- Juan Castelblanco

## Descripción y objetivo
CanchaYa permite reservar canchas de fútbol 5, baloncesto y voleibol. El objetivo de la integración es que el usuario escriba su solicitud en lenguaje natural y que la aplicación prepare la reserva automáticamente.

## Servicio inteligente utilizado
**API de Gemini de Google (AI Studio)**, modelo `gemini-3.1-flash-lite`. El servicio recibe la solicitud del usuario, la interpreta y devuelve en formato JSON la cancha, la fecha y la hora, junto con una respuesta en español. Se usa el nivel gratuito de la API.

## Tecnologías
- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js (módulos nativos, sin dependencias externas)
- IA: API de Gemini (Google)

## Configuración de credenciales
La clave de la API nunca se escribe en el código ni se sube a GitHub. Se configura como variable de entorno en el servidor:

- cmd: `set GEMINI_API_KEY=tu_clave`
- PowerShell: `$env:GEMINI_API_KEY="tu_clave"`

La clave se obtiene en aistudio.google.com. El archivo `.gitignore` excluye `.env` y `node_modules/`.

## Instalación
Requisitos:
- Node.js 18 o superior (verifica con `node -v`)
- Una clave de Gemini API (aistudio.google.com)

```
git clone https://github.com/juandead8515/canchaya.git
cd canchaya
```

## Ejecución
1. Configura la variable `GEMINI_API_KEY` en la terminal.
2. Inicia el servidor: `node backend\server.js`
3. Abre `http://localhost:3000` en el navegador.

## Funcionamiento
```
Usuario
  ↓
Interfaz (frontend/js/asistente.js)
  ↓ POST /api/asistente
Servidor Node.js (backend/server.js)
  ↓ HTTPS, tiempo de espera de 15 s
API de Gemini (Google)
  ↓ JSON
Servidor valida la respuesta (limpiarReserva)
  ↓
Interfaz muestra la respuesta y prellena el formulario de reserva
  ↓
Usuario confirma la reserva (frontend/js/app.js)
```

Funcionalidades:
- Navegación entre Inicio, Canchas, Reservar y Mis reservas.
- Reserva con validaciones de nombre, correo, fecha y horario.
- Detección de horarios ocupados.
- Reservas guardadas en el navegador (localStorage) y cancelación.
- Asistente virtual que interpreta la solicitud y prellena la reserva.

## Manejo de errores
| Situación | Mensaje al usuario | Acción posible |
|---|---|---|
| Clave inválida | Error de autenticación, revisar GEMINI_API_KEY | Corregir la clave y reiniciar |
| Servidor apagado | Indica que el servidor no está activo | Reiniciar y reintentar |
| Sin conexión a Internet | Revisar la conexión | Reintentar |
| Tiempo de espera agotado | El servicio tardó demasiado | Reintentar |
| Servicio no disponible (503) | El servicio está saturado | Reintentar más tarde |
|
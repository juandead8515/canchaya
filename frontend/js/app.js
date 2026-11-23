const Vistas = {
  inicio() {
    return `
      <section class="hero">
        <h1>Reserva tu cancha en segundos</h1>
        <p>Consulta disponibilidad y reserva canchas deportivas en línea.</p>
        <a href="#/reservar" class="btn">Reservar ahora</a>
      </section>
      <section class="section">
        <h2>¿Qué puedes hacer?</h2>
        <div class="steps">
          <div class="step"><span class="step-icon">🔍</span><h3>Consulta</h3><p>Revisa las canchas disponibles.</p></div>
          <div class="step"><span class="step-icon">📅</span><h3>Reserva</h3><p>Elige fecha y hora en línea.</p></div>
          <div class="step"><span class="step-icon">📋</span><h3>Administra</h3><p>Revisa y cancela tus reservas.</p></div>
        </div>
      </section>
    `;
  },

  canchas() {
    const tarjetas = CANCHAS.map(c => `
      <article class="card">
        <div class="card-img">${c.icono}</div>
        <h3>${c.nombre}</h3>
        <p>${c.descripcion}</p>
        <span class="price">$${c.precio.toLocaleString("es-CO")} / hora</span>
        <a href="#/reservar" class="btn btn-small">Reservar</a>
      </article>
    `).join("");

    return `
      <section class="section">
        <h2>Canchas disponibles</h2>
        <div class="cards">${tarjetas}</div>
      </section>
    `;
  },

  reservar() {
    const opcionesCanchas = CANCHAS.map(c => `<option value="${c.id}">${c.nombre}</option>`).join("");
    const opcionesHoras = HORARIOS.map(h => `<option value="${h}">${h}</option>`).join("");

    return `
      <section class="section">
        <h2>Nueva reserva</h2>
        <div id="mensajes"></div>
        <form id="form-reserva" class="formulario">
          <label>Nombre completo
            <input type="text" name="nombre" required>
          </label>
          <label>Correo electrónico
            <input type="email" name="correo" required>
          </label>
          <label>Cancha
            <select name="canchaId" required>${opcionesCanchas}</select>
          </label>
          <label>Fecha
            <input type="date" name="fecha" required>
          </label>
          <label>Hora
            <select name="hora" required>${opcionesHoras}</select>
          </label>
          <button type="submit" class="btn">Confirmar reserva</button>
        </form>
      </section>
    `;
  },

  misReservas() {
    const reservas = Almacen.obtenerReservas();

    if (reservas.length === 0) {
      return `
        <section class="section">
          <h2>Mis reservas</h2>
          <p class="vacio">Aún no tienes reservas. <a href="#/reservar">Haz una ahora</a>.</p>
        </section>
      `;
    }

    const filas = reservas.map(r => {
      const cancha = CANCHAS.find(c => c.id === r.canchaId);
      return `
        <li class="item-reserva">
          <div>
            <strong>${cancha ? cancha.nombre : "Cancha"}</strong><br>
            ${r.fecha} · ${r.hora} · ${r.nombre}
          </div>
          <button class="btn btn-peligro" data-cancelar="${r.id}">Cancelar</button>
        </li>
      `;
    }).join("");

    return `
      <section class="section">
        <h2>Mis reservas</h2>
        <ul class="lista-reservas">${filas}</ul>
      </section>
    `;
  }
};

const Rutas = {
  inicio: Vistas.inicio,
  canchas: Vistas.canchas,
  reservar: Vistas.reservar,
  "mis-reservas": Vistas.misReservas
};

function renderizar() {
  const ruta = location.hash.replace("#/", "") || "inicio";
  const vista = Rutas[ruta] || Rutas.inicio;
  document.getElementById("app").innerHTML = vista();

  document.querySelectorAll(".nav a").forEach(a => {
    a.classList.toggle("activo", a.getAttribute("href") === "#/" + ruta);
  });

  document.dispatchEvent(new Event("vistaRenderizada"));
}
function mostrarMensajes(lista, tipo) {
  const contenedor = document.getElementById("mensajes");
  if (!contenedor) return;
  contenedor.innerHTML = lista.map(m => `<div class="alerta alerta-${tipo}">${m}</div>`).join("");
}

// Envío del formulario de reserva
document.addEventListener("submit", e => {
  if (e.target.id !== "form-reserva") return;
  e.preventDefault();

  const form = e.target;
  const datos = {
    nombre: form.nombre.value,
    correo: form.correo.value,
    canchaId: form.canchaId.value,
    fecha: form.fecha.value,
    hora: form.hora.value
  };

  const reservas = Almacen.obtenerReservas();
  const errores = Validar.reserva(datos, reservas);

  if (errores.length > 0) {
    mostrarMensajes(errores, "error");
    return;
  }

  reservas.push({
    id: Date.now(),
    nombre: datos.nombre.trim(),
    correo: datos.correo.trim(),
    canchaId: Number(datos.canchaId),
    fecha: datos.fecha,
    hora: datos.hora
  });
  Almacen.guardarReservas(reservas);

  form.reset();
  mostrarMensajes(["¡Reserva confirmada! Puedes verla en Mis reservas."], "ok");
});

// Cancelar reservas
document.addEventListener("click", e => {
  const boton = e.target.closest("[data-cancelar]");
  if (!boton) return;

  const id = Number(boton.dataset.cancelar);
  const reservas = Almacen.obtenerReservas().filter(r => r.id !== id);
  Almacen.guardarReservas(reservas);
  renderizar();
});

window.addEventListener("hashchange", renderizar);
renderizar();

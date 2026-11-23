const Validar = {
  reserva(datos, reservasExistentes) {
    const errores = [];

    if (!datos.nombre || datos.nombre.trim().length < 3) {
      errores.push("El nombre debe tener al menos 3 caracteres.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) {
      errores.push("El correo no es válido.");
    }

    if (!CANCHAS.some(c => c.id === Number(datos.canchaId))) {
      errores.push("Selecciona una cancha.");
    }

    if (!datos.fecha) {
      errores.push("Selecciona una fecha.");
    } else {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaElegida = new Date(datos.fecha + "T00:00");
      if (fechaElegida < hoy) {
        errores.push("La fecha no puede ser anterior a hoy.");
      }
    }

    if (!HORARIOS.includes(datos.hora)) {
      errores.push("Selecciona una hora válida.");
    }

    const ocupada = reservasExistentes.some(r =>
      r.canchaId === Number(datos.canchaId) &&
      r.fecha === datos.fecha &&
      r.hora === datos.hora
    );
    if (ocupada) {
      errores.push("Esa cancha ya está reservada en ese horario.");
    }

    return errores;
  }
};

const CANCHAS = [
  { id: 1, nombre: "Cancha de fútbol 5", deporte: "Fútbol", precio: 60000, descripcion: "Césped sintético · Iluminación nocturna", icono: "⚽" },
  { id: 2, nombre: "Cancha de baloncesto", deporte: "Baloncesto", precio: 40000, descripcion: "Piso duro · Techada", icono: "🏀" },
  { id: 3, nombre: "Cancha de voleibol", deporte: "Voleibol", precio: 35000, descripcion: "Arena · Zona de sombra", icono: "🏐" }
];

const HORARIOS = ["08:00", "10:00", "14:00", "18:00", "20:00"];

const Almacen = {
  obtenerReservas() {
    return JSON.parse(localStorage.getItem("canchaya_reservas") || "[]");
  },
  guardarReservas(lista) {
    localStorage.setItem("canchaya_reservas", JSON.stringify(lista));
  }
};

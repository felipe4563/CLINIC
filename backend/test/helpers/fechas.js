// Fechas de prueba calculadas en relacion a "hoy" en vez de fechas fijas.
// getSlotsDisponibles descarta cualquier fecha anterior a hoy (ver
// src/services/disponibilidad.js), asi que una fecha fija en los fixtures
// queda "vencida" apenas pasa el calendario. proximoLunes siempre devuelve
// un lunes estrictamente futuro (nunca hoy), para que quede alineado con los
// fixtures de HorarioDisponible que usan dia_semana: 1 (lunes).

function proximoLunes(semanasAdelante = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dia = d.getDay(); // 0=domingo … 6=sabado
  const diasHastaLunes = ((1 - dia) + 7) % 7 || 7;
  d.setDate(d.getDate() + diasHastaLunes + semanasAdelante * 7);
  return d.toISOString().slice(0, 10);
}

function sumarDias(fechaISO, dias) {
  const d = new Date(`${fechaISO}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

module.exports = { proximoLunes, sumarDias };

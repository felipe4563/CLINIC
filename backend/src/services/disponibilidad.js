const { Op } = require('sequelize');
const db = require('../models');

function toMinutes(hhmmss) {
  const [h, m] = hhmmss.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(totalMinutes) {
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const m = String(totalMinutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

const PENDIENTE_PAGO_TTL_MS = 15 * 60 * 1000;

async function getSlotsDisponibles({ profesionalId, servicioId, fecha }) {
  const hoy = new Date().toISOString().slice(0, 10);
  if (fecha < hoy) return [];

  const servicioProfesional = await db.ServicioProfesional.findOne({
    where: { profesional_id: profesionalId, servicio_id: servicioId },
  });
  if (!servicioProfesional) return [];

  const servicio = await db.Servicio.findByPk(servicioId);
  const duracion = servicioProfesional.duracion_min_override || servicio.duracion_min;

  const diaSemana = new Date(`${fecha}T00:00:00`).getDay();
  const horario = await db.HorarioDisponible.findOne({
    where: { profesional_id: profesionalId, dia_semana: diaSemana },
  });
  if (!horario) return [];

  const citasDelDia = await db.Cita.findAll({
    where: {
      profesional_id: profesionalId,
      fecha,
      estado: { [Op.ne]: 'cancelada' },
    },
  });
  const ahora = Date.now();
  const ocupados = citasDelDia
    .filter((c) => {
      if (c.estado !== 'pendiente_pago') return true;
      return ahora - new Date(c.createdAt).getTime() < PENDIENTE_PAGO_TTL_MS;
    })
    .map((c) => ({
      inicio: toMinutes(c.hora_inicio),
      fin: toMinutes(c.hora_fin),
    }));

  const inicioJornada = toMinutes(horario.hora_inicio);
  const finJornada = toMinutes(horario.hora_fin);

  const slots = [];
  for (let inicio = inicioJornada; inicio + duracion <= finJornada; inicio += duracion) {
    const fin = inicio + duracion;
    const solapa = ocupados.some((o) => inicio < o.fin && fin > o.inicio);
    if (!solapa) {
      slots.push({ hora_inicio: toHHMM(inicio), hora_fin: toHHMM(fin) });
    }
  }
  return slots;
}

module.exports = { getSlotsDisponibles };

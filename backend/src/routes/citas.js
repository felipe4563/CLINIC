const express = require('express');
const db = require('../models');
const { requirePaciente } = require('./auth.middleware');
const { getSlotsDisponibles } = require('../services/disponibilidad');

const router = express.Router();

const PORCENTAJES_VALIDOS = [50, 100];

router.post('/citas', requirePaciente, async (req, res) => {
  const { profesionalId, servicioId, fecha, horaInicio, porcentajePago } = req.body;
  if (!profesionalId || !servicioId || !fecha || !horaInicio) {
    return res.status(400).json({ error: 'profesionalId, servicioId, fecha y horaInicio son requeridos' });
  }
  const porcentaje = porcentajePago ? Number(porcentajePago) : 100;
  if (!PORCENTAJES_VALIDOS.includes(porcentaje)) {
    return res.status(400).json({ error: 'porcentajePago debe ser 50 o 100' });
  }

  const slots = await getSlotsDisponibles({
    profesionalId: Number(profesionalId), servicioId: Number(servicioId), fecha,
  });
  const slot = slots.find((s) => s.hora_inicio === horaInicio);
  if (!slot) {
    return res.status(409).json({ error: 'El horario ya no esta disponible' });
  }

  const servicio = await db.Servicio.findByPk(servicioId);

  const cita = await db.Cita.create({
    paciente_id: req.pacienteId,
    profesional_id: profesionalId,
    servicio_id: servicioId,
    fecha,
    hora_inicio: `${slot.hora_inicio}:00`,
    hora_fin: `${slot.hora_fin}:00`,
    estado: 'pendiente_pago',
  });

  const montoTotal = Number(servicio.precio);
  const monto = Math.round(montoTotal * (porcentaje / 100) * 100) / 100;

  const pago = await db.Pago.create({
    cita_id: cita.id,
    monto,
    monto_total: montoTotal,
    porcentaje,
    estado: 'pendiente',
  });

  res.status(201).json({ cita, pago });
});

router.get('/citas/mias', requirePaciente, async (req, res) => {
  const citas = await db.Cita.findAll({
    where: { paciente_id: req.pacienteId },
    include: [db.Profesional, db.Servicio, db.Pago],
    order: [['fecha', 'DESC'], ['hora_inicio', 'DESC']],
  });
  res.json(citas);
});

module.exports = router;

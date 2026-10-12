const express = require('express');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { normalizarUid, resumenSellos } = require('../services/sellos');

const router = express.Router();
const onlyPacientes = requirePermiso('pacientes');

const ATRIBUTOS_PACIENTE = ['id', 'codigo_paciente', 'nombre_completo', 'telefono', 'puntos_actuales'];

function vistaTarjeta(t) {
  return t ? { id: t.id, uid: t.uid, estado: t.estado, creada: t.created_at || t.createdAt } : null;
}

// Pasar la tarjeta: identifica a la paciente y trae su cartilla de sellos.
router.get('/staff/tarjetas/:uid', onlyPacientes, async (req, res) => {
  const uid = normalizarUid(req.params.uid);
  if (!uid) return res.status(400).json({ error: 'Número de tarjeta inválido' });

  const tarjeta = await db.TarjetaFidelizacion.findOne({
    where: { uid },
    include: [{ model: db.Paciente, attributes: ATRIBUTOS_PACIENTE }],
  });
  if (!tarjeta) return res.status(404).json({ error: 'Tarjeta no registrada', uid });
  if (tarjeta.estado === 'bloqueada') {
    return res.status(410).json({ error: 'Esta tarjeta fue bloqueada', uid, paciente: tarjeta.Paciente });
  }
  res.json({ tarjeta: vistaTarjeta(tarjeta), paciente: tarjeta.Paciente, ...(await resumenSellos(tarjeta.paciente_id)) });
});

router.get('/staff/pacientes/:id/tarjeta', onlyPacientes, async (req, res) => {
  const paciente = await db.Paciente.findByPk(req.params.id, { attributes: ['id'] });
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });
  const tarjeta = await db.TarjetaFidelizacion.findOne({
    where: { paciente_id: paciente.id, estado: 'activa' },
    order: [['id', 'DESC']],
  });
  res.json({ tarjeta: vistaTarjeta(tarjeta), ...(await resumenSellos(paciente.id)) });
});

// Vincula una tarjeta. Si la paciente ya tenía una activa, esa se bloquea (reemplazo).
router.post('/staff/pacientes/:id/tarjeta', onlyPacientes, async (req, res) => {
  const uid = normalizarUid(req.body.uid);
  if (!uid) return res.status(400).json({ error: 'Número de tarjeta inválido' });
  const paciente = await db.Paciente.findByPk(req.params.id, { attributes: ['id'] });
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

  const existente = await db.TarjetaFidelizacion.findOne({
    where: { uid },
    include: [{ model: db.Paciente, attributes: ['id', 'nombre_completo'] }],
  });
  if (existente) {
    if (existente.paciente_id !== paciente.id) {
      return res.status(409).json({ error: `Esta tarjeta ya pertenece a ${existente.Paciente.nombre_completo}` });
    }
    if (existente.estado === 'bloqueada') {
      return res.status(409).json({ error: 'Esta tarjeta fue bloqueada; usa una tarjeta nueva' });
    }
    return res.json({ tarjeta: vistaTarjeta(existente) });
  }

  await db.TarjetaFidelizacion.update(
    { estado: 'bloqueada' },
    { where: { paciente_id: paciente.id, estado: 'activa' } }
  );
  const tarjeta = await db.TarjetaFidelizacion.create({ paciente_id: paciente.id, uid });
  res.status(201).json({ tarjeta: vistaTarjeta(tarjeta) });
});

router.patch('/staff/tarjetas/:id/bloquear', onlyPacientes, async (req, res) => {
  const tarjeta = await db.TarjetaFidelizacion.findByPk(req.params.id);
  if (!tarjeta) return res.status(404).json({ error: 'Tarjeta no encontrada' });
  tarjeta.estado = 'bloqueada';
  await tarjeta.save();
  res.json({ tarjeta: vistaTarjeta(tarjeta) });
});

module.exports = router;

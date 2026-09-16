const express = require('express');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');

const router = express.Router();
const onlyFidelizacion = requirePermiso('fidelizacion');

router.get('/staff/fidelizacion/pacientes/:id', onlyFidelizacion, async (req, res) => {
  const paciente = await db.Paciente.findByPk(req.params.id);
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

  const movimientos = await db.MovimientoPuntos.findAll({
    where: { paciente_id: paciente.id },
    include: [
      { model: db.Recompensa, attributes: ['id', 'nombre'] },
      { model: db.Usuario, attributes: ['id', 'nombre'] },
    ],
    order: [['id', 'DESC']],
  });

  res.json({ paciente, movimientos });
});

router.post('/staff/fidelizacion/pacientes/:id/ajuste', onlyFidelizacion, async (req, res) => {
  const { puntos, motivo } = req.body;
  const puntosNum = Number(puntos);
  if (!puntosNum || !Number.isInteger(puntosNum)) {
    return res.status(400).json({ error: 'puntos debe ser un numero entero distinto de cero' });
  }
  if (!motivo || !motivo.trim()) {
    return res.status(400).json({ error: 'motivo es requerido' });
  }

  const paciente = await db.Paciente.findByPk(req.params.id);
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

  if (paciente.puntos_actuales + puntosNum < 0) {
    return res.status(400).json({ error: 'El ajuste dejaria el saldo de puntos en negativo' });
  }

  paciente.puntos_actuales += puntosNum;
  await paciente.save();

  const movimiento = await db.MovimientoPuntos.create({
    paciente_id: paciente.id,
    tipo: 'ajuste',
    puntos: puntosNum,
    motivo: motivo.trim(),
    usuario_id: req.usuarioId,
  });

  res.status(201).json({ paciente, movimiento });
});

router.post('/staff/fidelizacion/pacientes/:id/canjear', onlyFidelizacion, async (req, res) => {
  const { recompensaId } = req.body;
  if (!recompensaId) return res.status(400).json({ error: 'recompensaId es requerido' });

  const paciente = await db.Paciente.findByPk(req.params.id);
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

  const recompensa = await db.Recompensa.findByPk(recompensaId);
  if (!recompensa || !recompensa.activo) {
    return res.status(404).json({ error: 'Recompensa no encontrada o inactiva' });
  }

  if (paciente.puntos_actuales < recompensa.costo_puntos) {
    return res.status(400).json({ error: 'El paciente no tiene puntos suficientes para esta recompensa' });
  }

  paciente.puntos_actuales -= recompensa.costo_puntos;
  await paciente.save();

  const movimiento = await db.MovimientoPuntos.create({
    paciente_id: paciente.id,
    tipo: 'canje',
    puntos: -recompensa.costo_puntos,
    motivo: `Canje: ${recompensa.nombre}`,
    recompensa_id: recompensa.id,
    usuario_id: req.usuarioId,
  });

  res.status(201).json({ paciente, movimiento });
});

router.get('/staff/fidelizacion/recompensas', onlyFidelizacion, async (req, res) => {
  const recompensas = await db.Recompensa.findAll({ order: [['costo_puntos', 'ASC']] });
  res.json(recompensas);
});

router.post('/staff/fidelizacion/recompensas', onlyFidelizacion, async (req, res) => {
  const { nombre, descripcion, costo_puntos } = req.body;
  const costo = Number(costo_puntos);
  if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'nombre es requerido' });
  if (!costo || costo <= 0 || !Number.isInteger(costo)) {
    return res.status(400).json({ error: 'costo_puntos debe ser un numero entero positivo' });
  }

  const recompensa = await db.Recompensa.create({
    nombre: nombre.trim(),
    descripcion: descripcion || null,
    costo_puntos: costo,
  });
  res.status(201).json(recompensa);
});

router.put('/staff/fidelizacion/recompensas/:id', onlyFidelizacion, async (req, res) => {
  const recompensa = await db.Recompensa.findByPk(req.params.id);
  if (!recompensa) return res.status(404).json({ error: 'Recompensa no encontrada' });

  const { nombre, descripcion, costo_puntos, activo } = req.body;
  if (nombre !== undefined) {
    if (!nombre.trim()) return res.status(400).json({ error: 'nombre no puede estar vacio' });
    recompensa.nombre = nombre.trim();
  }
  if (descripcion !== undefined) recompensa.descripcion = descripcion || null;
  if (costo_puntos !== undefined) {
    const costo = Number(costo_puntos);
    if (!costo || costo <= 0 || !Number.isInteger(costo)) {
      return res.status(400).json({ error: 'costo_puntos debe ser un numero entero positivo' });
    }
    recompensa.costo_puntos = costo;
  }
  if (typeof activo === 'boolean') recompensa.activo = activo;

  await recompensa.save();
  res.json(recompensa);
});

module.exports = router;

const express = require('express');
const { Op } = require('sequelize');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { generarCodigoCliente } = require('../services/codigoCliente');

const router = express.Router();

router.get('/staff/pacientes', requirePermiso('pacientes'), async (req, res) => {
  const { q } = req.query;
  const where = q
    ? {
        [Op.or]: [
          { nombre_completo: { [Op.like]: `%${q}%` } },
          { telefono: { [Op.like]: `%${q}%` } },
          { carnet_identidad: { [Op.like]: `%${q}%` } },
          { codigo_paciente: { [Op.like]: `%${q}%` } },
        ],
      }
    : {};

  const pacientes = await db.Paciente.findAll({ where, order: [['nombre_completo', 'ASC']] });
  res.json(pacientes);
});

router.post('/staff/pacientes', requirePermiso('pacientes'), async (req, res) => {
  const { nombre_completo, telefono, carnet_identidad, carnet_complemento, carnet_expedido, fecha_nacimiento } = req.body;
  if (!nombre_completo || !telefono || !carnet_identidad || !carnet_expedido) {
    return res.status(400).json({ error: 'nombre_completo, telefono, carnet_identidad y carnet_expedido son requeridos' });
  }

  const existente = await db.Paciente.findOne({ where: { telefono } });
  if (existente) return res.status(409).json({ error: 'Ya existe un paciente con ese telefono' });

  const paciente = await db.Paciente.create({
    codigo_paciente: await generarCodigoCliente(db),
    nombre_completo,
    telefono,
    carnet_identidad,
    carnet_complemento: carnet_complemento || null,
    carnet_expedido,
    fecha_nacimiento: fecha_nacimiento || null,
  });

  res.status(201).json(paciente);
});

router.get('/staff/pacientes/:id', requirePermiso('pacientes'), async (req, res) => {
  const paciente = await db.Paciente.findByPk(req.params.id, {
    include: [{ model: db.Cita, include: [db.Profesional, db.Servicio] }],
  });
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });
  res.json(paciente);
});

router.patch('/staff/pacientes/:id', requirePermiso('pacientes'), async (req, res) => {
  const paciente = await db.Paciente.findByPk(req.params.id);
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

  const { nombre_completo, carnet_identidad, carnet_complemento, carnet_expedido, fecha_nacimiento } = req.body;
  if (nombre_completo !== undefined) paciente.nombre_completo = nombre_completo;
  if (carnet_identidad !== undefined) paciente.carnet_identidad = carnet_identidad;
  if (carnet_complemento !== undefined) paciente.carnet_complemento = carnet_complemento;
  if (carnet_expedido !== undefined) paciente.carnet_expedido = carnet_expedido;
  if (fecha_nacimiento !== undefined) paciente.fecha_nacimiento = fecha_nacimiento;

  await paciente.save();
  res.json(paciente);
});

router.delete('/staff/pacientes/:id', requirePermiso('pacientes'), async (req, res) => {
  const paciente = await db.Paciente.findByPk(req.params.id);
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

  const citasCount = await db.Cita.count({ where: { paciente_id: paciente.id } });
  if (citasCount > 0) {
    return res.status(409).json({ error: 'No se puede eliminar: el paciente tiene citas registradas' });
  }

  await paciente.destroy();
  res.status(204).end();
});

module.exports = router;

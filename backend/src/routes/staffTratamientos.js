const express = require('express');
const { Op } = require('sequelize');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');

const router = express.Router();
const onlyPacientes = requirePermiso('pacientes');

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function normalizarHora(hora) {
  if (!hora) return null;
  return hora.length === 5 ? `${hora}:00` : hora;
}

async function chocaConCita(profesionalId, fecha, hora) {
  if (!profesionalId || !fecha || !hora) return false;
  const citas = await db.Cita.findAll({
    where: { profesional_id: profesionalId, fecha, estado: { [Op.ne]: 'cancelada' } },
  });
  return citas.some((c) => hora >= c.hora_inicio && hora < c.hora_fin);
}

router.get('/staff/tratamientos', onlyPacientes, async (req, res) => {
  const { q } = req.query;
  const incluirPaciente = q
    ? { model: db.Paciente, where: { nombre_completo: { [Op.like]: `%${q}%` } } }
    : db.Paciente;

  const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
  const porPagina = Math.min(100, Math.max(1, parseInt(req.query.porPagina, 10) || 20));

  const { count, rows } = await db.NotaClinica.findAndCountAll({
    include: [incluirPaciente, db.Profesional],
    order: [['fecha', 'DESC'], ['hora', 'DESC'], ['id', 'DESC']],
    limit: porPagina,
    offset: (pagina - 1) * porPagina,
    distinct: true,
  });

  res.json({ notas: rows, total: count, pagina, totalPaginas: Math.max(1, Math.ceil(count / porPagina)) });
});

router.get('/staff/pacientes/:id/tratamientos', onlyPacientes, async (req, res) => {
  const notas = await db.NotaClinica.findAll({
    where: { paciente_id: req.params.id },
    include: [db.Profesional],
    order: [['fecha', 'DESC'], ['hora', 'DESC'], ['id', 'DESC']],
  });
  res.json(notas);
});

router.post('/staff/pacientes/:id/tratamientos', onlyPacientes, async (req, res) => {
  const paciente = await db.Paciente.findByPk(req.params.id);
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

  const { titulo, notas, fecha, hora, profesionalId } = req.body;
  if (!titulo || !notas) return res.status(400).json({ error: 'titulo y notas son requeridos' });

  const fechaNota = fecha || hoyISO();
  const horaNota = normalizarHora(hora);

  if (await chocaConCita(profesionalId, fechaNota, horaNota)) {
    return res.status(409).json({ error: 'El profesional ya tiene una cita reservada a esa hora' });
  }

  const nota = await db.NotaClinica.create({
    paciente_id: paciente.id,
    profesional_id: profesionalId || null,
    fecha: fechaNota,
    hora: horaNota,
    titulo,
    notas,
  });

  const conProfesional = await db.NotaClinica.findByPk(nota.id, { include: [db.Profesional] });
  res.status(201).json(conProfesional);
});

router.patch('/staff/tratamientos/:id', onlyPacientes, async (req, res) => {
  const nota = await db.NotaClinica.findByPk(req.params.id);
  if (!nota) return res.status(404).json({ error: 'Nota no encontrada' });

  const { titulo, notas, fecha, hora, profesionalId } = req.body;
  const fechaFinal = fecha !== undefined ? fecha : nota.fecha;
  const horaFinal = hora !== undefined ? normalizarHora(hora) : nota.hora;
  const profesionalFinal = profesionalId !== undefined ? profesionalId || null : nota.profesional_id;

  if (await chocaConCita(profesionalFinal, fechaFinal, horaFinal)) {
    return res.status(409).json({ error: 'El profesional ya tiene una cita reservada a esa hora' });
  }

  if (titulo !== undefined) nota.titulo = titulo;
  if (notas !== undefined) nota.notas = notas;
  nota.fecha = fechaFinal;
  nota.hora = horaFinal;
  nota.profesional_id = profesionalFinal;

  await nota.save();
  const conProfesional = await db.NotaClinica.findByPk(nota.id, { include: [db.Profesional] });
  res.json(conProfesional);
});

router.delete('/staff/tratamientos/:id', onlyPacientes, async (req, res) => {
  const nota = await db.NotaClinica.findByPk(req.params.id);
  if (!nota) return res.status(404).json({ error: 'Nota no encontrada' });
  await nota.destroy();
  res.status(204).end();
});

module.exports = router;

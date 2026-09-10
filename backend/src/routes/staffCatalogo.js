const express = require('express');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');

const router = express.Router();

const onlyAdmin = requirePermiso('catalogo');

// --- Servicios ---

router.get('/staff/servicios', onlyAdmin, async (req, res) => {
  const servicios = await db.Servicio.findAll({ include: [db.Producto], order: [['nombre', 'ASC']] });
  res.json(servicios);
});

router.post('/staff/servicios/:id/productos', onlyAdmin, async (req, res) => {
  const servicio = await db.Servicio.findByPk(req.params.id);
  if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });
  const { productoId } = req.body;
  const producto = await db.Producto.findByPk(productoId);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

  await db.ServicioProducto.findOrCreate({
    where: { servicio_id: servicio.id, producto_id: producto.id },
  });
  res.status(201).json({ ok: true });
});

router.delete('/staff/servicios/:id/productos/:productoId', onlyAdmin, async (req, res) => {
  await db.ServicioProducto.destroy({
    where: { servicio_id: req.params.id, producto_id: req.params.productoId },
  });
  res.json({ ok: true });
});

router.post('/staff/servicios', onlyAdmin, async (req, res) => {
  const { nombre, descripcion, duracion_min, precio, activo } = req.body;
  if (!nombre || !duracion_min || precio === undefined) {
    return res.status(400).json({ error: 'nombre, duracion_min y precio son requeridos' });
  }
  const servicio = await db.Servicio.create({ nombre, descripcion, duracion_min, precio, activo });
  res.status(201).json(servicio);
});

router.patch('/staff/servicios/:id', onlyAdmin, async (req, res) => {
  const servicio = await db.Servicio.findByPk(req.params.id);
  if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

  const { nombre, descripcion, duracion_min, precio, activo } = req.body;
  if (nombre !== undefined) servicio.nombre = nombre;
  if (descripcion !== undefined) servicio.descripcion = descripcion;
  if (duracion_min !== undefined) servicio.duracion_min = duracion_min;
  if (precio !== undefined) servicio.precio = precio;
  if (activo !== undefined) servicio.activo = activo;

  await servicio.save();
  res.json(servicio);
});

// --- Profesionales ---

router.get('/staff/profesionales', onlyAdmin, async (req, res) => {
  const profesionales = await db.Profesional.findAll({
    include: [db.Servicio],
    order: [['nombre', 'ASC']],
  });
  res.json(profesionales);
});

router.post('/staff/profesionales', onlyAdmin, async (req, res) => {
  const { nombre, especialidad, foto_url, activo } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });
  const profesional = await db.Profesional.create({ nombre, especialidad, foto_url, activo });
  res.status(201).json(profesional);
});

router.patch('/staff/profesionales/:id', onlyAdmin, async (req, res) => {
  const profesional = await db.Profesional.findByPk(req.params.id);
  if (!profesional) return res.status(404).json({ error: 'Profesional no encontrado' });

  const { nombre, especialidad, foto_url, activo } = req.body;
  if (nombre !== undefined) profesional.nombre = nombre;
  if (especialidad !== undefined) profesional.especialidad = especialidad;
  if (foto_url !== undefined) profesional.foto_url = foto_url;
  if (activo !== undefined) profesional.activo = activo;

  await profesional.save();
  res.json(profesional);
});

router.post('/staff/profesionales/:id/servicios', onlyAdmin, async (req, res) => {
  const profesional = await db.Profesional.findByPk(req.params.id);
  if (!profesional) return res.status(404).json({ error: 'Profesional no encontrado' });
  const { servicioId } = req.body;
  const servicio = await db.Servicio.findByPk(servicioId);
  if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

  await db.ServicioProfesional.findOrCreate({
    where: { servicio_id: servicio.id, profesional_id: profesional.id },
  });
  res.status(201).json({ ok: true });
});

router.delete('/staff/profesionales/:id/servicios/:servicioId', onlyAdmin, async (req, res) => {
  await db.ServicioProfesional.destroy({
    where: { profesional_id: req.params.id, servicio_id: req.params.servicioId },
  });
  res.json({ ok: true });
});

// --- Horarios disponibles ---

router.get('/staff/profesionales/:id/horarios', onlyAdmin, async (req, res) => {
  const horarios = await db.HorarioDisponible.findAll({
    where: { profesional_id: req.params.id },
    order: [['dia_semana', 'ASC'], ['hora_inicio', 'ASC']],
  });
  res.json(horarios);
});

router.post('/staff/profesionales/:id/horarios', onlyAdmin, async (req, res) => {
  const profesional = await db.Profesional.findByPk(req.params.id);
  if (!profesional) return res.status(404).json({ error: 'Profesional no encontrado' });

  const { dia_semana, hora_inicio, hora_fin } = req.body;
  if (dia_semana === undefined || !hora_inicio || !hora_fin) {
    return res.status(400).json({ error: 'dia_semana, hora_inicio y hora_fin son requeridos' });
  }

  const horario = await db.HorarioDisponible.create({
    profesional_id: profesional.id,
    dia_semana,
    hora_inicio,
    hora_fin,
  });
  res.status(201).json(horario);
});

router.delete('/staff/horarios/:id', onlyAdmin, async (req, res) => {
  await db.HorarioDisponible.destroy({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;

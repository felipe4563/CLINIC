const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { ESPECIALIDADES, leerCategoria } = require('../config/categoriasServicio');

const router = express.Router();

const onlyAdmin = requirePermiso('catalogo');

// --- Servicios ---

// Las especialidades y grupos que se pueden elegir al crear o editar un servicio.
router.get('/staff/servicios/categorias', onlyAdmin, (req, res) => {
  res.json(ESPECIALIDADES);
});

router.get('/staff/servicios', onlyAdmin, async (req, res) => {
  const servicios = await db.Servicio.findAll({ include: [db.Producto], order: [['nombre', 'ASC']] });
  res.json(servicios);
});

const CANTIDAD_INVALIDA = 'La cantidad por sesión debe ser un número entero de 1 a 1000';
function cantidadPorSesion(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n >= 1 && n <= 1000 ? n : null;
}

router.post('/staff/servicios/:id/productos', onlyAdmin, async (req, res) => {
  const servicio = await db.Servicio.findByPk(req.params.id);
  if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });
  const { productoId } = req.body;
  const producto = await db.Producto.findByPk(productoId);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  const cantidad = cantidadPorSesion(req.body.cantidad ?? 1);
  if (cantidad === null) return res.status(400).json({ error: CANTIDAD_INVALIDA });

  const [uso, creado] = await db.ServicioProducto.findOrCreate({
    where: { servicio_id: servicio.id, producto_id: producto.id },
    defaults: { cantidad },
  });
  if (!creado && uso.cantidad !== cantidad) await uso.update({ cantidad });
  res.status(201).json({ ok: true, cantidad });
});

// Cuánto usa el tratamiento de ese producto en cada sesión.
router.patch('/staff/servicios/:id/productos/:productoId', onlyAdmin, async (req, res) => {
  const cantidad = cantidadPorSesion(req.body.cantidad);
  if (cantidad === null) return res.status(400).json({ error: CANTIDAD_INVALIDA });
  const uso = await db.ServicioProducto.findOne({ where: { servicio_id: req.params.id, producto_id: req.params.productoId } });
  if (!uso) return res.status(404).json({ error: 'Ese tratamiento no usa ese producto' });
  await uso.update({ cantidad });
  res.json({ ok: true, cantidad });
});

router.delete('/staff/servicios/:id/productos/:productoId', onlyAdmin, async (req, res) => {
  await db.ServicioProducto.destroy({
    where: { servicio_id: req.params.id, producto_id: req.params.productoId },
  });
  res.json({ ok: true });
});

const SELLOS_INVALIDOS = 'sellos_requeridos debe ser un número entero entre 2 y 50, o vacío';

// Tarjeta de sellos: null/'' = sin cartilla; false = valor inválido.
function leerSellosRequeridos(valor) {
  if (valor === undefined) return undefined;
  if (valor === null || valor === '') return null;
  const n = Number(valor);
  return Number.isInteger(n) && n >= 2 && n <= 50 ? n : false;
}

router.post('/staff/servicios', onlyAdmin, async (req, res) => {
  const { nombre, descripcion, duracion_min, precio, activo } = req.body;
  if (!nombre || !duracion_min || precio === undefined) {
    return res.status(400).json({ error: 'nombre, duracion_min y precio son requeridos' });
  }
  const sellos = leerSellosRequeridos(req.body.sellos_requeridos);
  if (sellos === false) return res.status(400).json({ error: SELLOS_INVALIDOS });
  const categoria = leerCategoria(req.body.especialidad, req.body.grupo);
  if (categoria.error) return res.status(400).json({ error: categoria.error });
  const servicio = await db.Servicio.create({
    nombre, descripcion, duracion_min, precio, activo, sellos_requeridos: sellos ?? null, especialidad: categoria.especialidad, grupo: categoria.grupo,
  });
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
  if (req.body.especialidad !== undefined || req.body.grupo !== undefined) {
    const categoria = leerCategoria(
      req.body.especialidad !== undefined ? req.body.especialidad : servicio.especialidad,
      req.body.grupo !== undefined ? req.body.grupo : servicio.grupo,
    );
    if (categoria.error) return res.status(400).json({ error: categoria.error });
    servicio.especialidad = categoria.especialidad;
    servicio.grupo = categoria.grupo;
  }
  if (req.body.sellos_requeridos !== undefined) {
    const sellos = leerSellosRequeridos(req.body.sellos_requeridos);
    if (sellos === false) return res.status(400).json({ error: SELLOS_INVALIDOS });
    servicio.sellos_requeridos = sellos;
  }

  await servicio.save();
  res.json(servicio);
});

// --- Profesionales ---

// Foto pública del profesional (la muestra la página web).
const FOTOS_DIR = path.join(__dirname, '..', '..', 'uploads', 'profesionales');
fs.mkdirSync(FOTOS_DIR, { recursive: true });
const EXT_FOTO = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };

const uploadFoto = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, FOTOS_DIR),
    filename: (req, file, cb) => cb(null, `profesional-${req.params.id}-${Date.now()}${EXT_FOTO[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!EXT_FOTO[file.mimetype]) return cb(new Error('Formato no soportado. Usa PNG, JPG o WEBP.'));
    cb(null, true);
  },
});

function borrarFoto(fotoUrl) {
  if (!fotoUrl || !fotoUrl.startsWith('/uploads/profesionales/')) return;
  fs.unlink(path.join(FOTOS_DIR, path.basename(fotoUrl)), () => {});
}

function textoOpcional(valor) {
  const texto = String(valor ?? '').trim();
  return texto || null;
}

const FORMACION_INVALIDA = 'formacion debe ser una lista de hasta 20 líneas con titulo y detalle';

// [{ titulo, detalle }]: se recortan espacios y se quitan las líneas vacías. null = inválido.
function leerFormacion(valor) {
  if (!Array.isArray(valor) || valor.length > 20) return null;
  const lista = [];
  for (const item of valor) {
    if (!item || typeof item !== 'object') return null;
    const titulo = String(item.titulo ?? '').trim().slice(0, 120);
    const detalle = String(item.detalle ?? '').trim().slice(0, 200);
    if (titulo || detalle) lista.push({ titulo, detalle });
  }
  return lista;
}

router.get('/staff/profesionales', onlyAdmin, async (req, res) => {
  const profesionales = await db.Profesional.findAll({
    include: [db.Servicio],
    order: [['nombre', 'ASC']],
  });
  res.json(profesionales);
});

router.post('/staff/profesionales', onlyAdmin, async (req, res) => {
  const { nombre, especialidad, registro_profesional, foto_url, activo } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });
  const profesional = await db.Profesional.create({ nombre, especialidad, registro_profesional, foto_url, activo });
  res.status(201).json(profesional);
});

router.patch('/staff/profesionales/:id', onlyAdmin, async (req, res) => {
  const profesional = await db.Profesional.findByPk(req.params.id);
  if (!profesional) return res.status(404).json({ error: 'Profesional no encontrado' });

  const { nombre, especialidad, registro_profesional, foto_url, activo, cargo, biografia } = req.body;
  if (nombre !== undefined) profesional.nombre = nombre;
  if (especialidad !== undefined) profesional.especialidad = especialidad;
  if (registro_profesional !== undefined) profesional.registro_profesional = registro_profesional;
  if (foto_url !== undefined) profesional.foto_url = foto_url;
  if (activo !== undefined) profesional.activo = activo;
  if (cargo !== undefined) profesional.cargo = textoOpcional(cargo);
  if (biografia !== undefined) profesional.biografia = textoOpcional(biografia);
  if (req.body.formacion !== undefined) {
    const formacion = leerFormacion(req.body.formacion);
    if (!formacion) return res.status(400).json({ error: FORMACION_INVALIDA });
    profesional.formacion = formacion;
  }
  if (req.body.orden_web !== undefined) {
    const orden = Number(req.body.orden_web);
    if (!Number.isInteger(orden) || orden < 0 || orden > 999) {
      return res.status(400).json({ error: 'orden_web debe ser un número entero entre 0 y 999' });
    }
    profesional.orden_web = orden;
  }
  if (req.body.mostrar_en_web !== undefined) profesional.mostrar_en_web = Boolean(req.body.mostrar_en_web);
  if (profesional.mostrar_en_web && !profesional.biografia) {
    return res.status(400).json({ error: 'Para mostrarlo en la web primero escribe su biografía' });
  }

  await profesional.save();
  res.json(profesional);
});

router.post('/staff/profesionales/:id/foto', onlyAdmin, async (req, res) => {
  const profesional = await db.Profesional.findByPk(req.params.id);
  if (!profesional) return res.status(404).json({ error: 'Profesional no encontrado' });
  uploadFoto.single('foto')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
    borrarFoto(profesional.foto_url);
    profesional.foto_url = `/uploads/profesionales/${req.file.filename}`;
    await profesional.save();
    res.json(profesional);
  });
});

router.delete('/staff/profesionales/:id/foto', onlyAdmin, async (req, res) => {
  const profesional = await db.Profesional.findByPk(req.params.id);
  if (!profesional) return res.status(404).json({ error: 'Profesional no encontrado' });
  borrarFoto(profesional.foto_url);
  profesional.foto_url = null;
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

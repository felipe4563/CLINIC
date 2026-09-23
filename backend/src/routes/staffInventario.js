const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const { Op } = require('sequelize');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');

const router = express.Router();
const onlyInventario = requirePermiso('inventario');

const PRODUCTOS_DIR = path.join(__dirname, '..', '..', 'uploads', 'productos');
fs.mkdirSync(PRODUCTOS_DIR, { recursive: true });

const ACTIVOS_DIR = path.join(__dirname, '..', '..', 'uploads', 'activos');
fs.mkdirSync(ACTIVOS_DIR, { recursive: true });

const EXT_POR_MIME = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

function crearUploaderImagen(dir, prefijo) {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, dir),
      filename: (req, file, cb) => cb(null, `${prefijo}-${req.params.id}-${Date.now()}${EXT_POR_MIME[file.mimetype]}`),
    }),
    limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!EXT_POR_MIME[file.mimetype]) return cb(new Error('Formato no soportado. Usa PNG, JPG o WEBP.'));
      cb(null, true);
    },
  });
}

function crearBorradorImagen(dir, subcarpeta) {
  return function borrarImagen(imagenUrl) {
    if (!imagenUrl || !imagenUrl.startsWith(`/uploads/${subcarpeta}/`)) return;
    const archivo = path.join(dir, path.basename(imagenUrl));
    fs.unlink(archivo, () => {});
  };
}

const uploadImagenProducto = crearUploaderImagen(PRODUCTOS_DIR, 'producto');
const borrarImagenProducto = crearBorradorImagen(PRODUCTOS_DIR, 'productos');

const uploadImagenActivo = crearUploaderImagen(ACTIVOS_DIR, 'activo');
const borrarImagenActivo = crearBorradorImagen(ACTIVOS_DIR, 'activos');

// --- Marcas ---

router.get('/staff/marcas', onlyInventario, async (req, res) => {
  const marcas = await db.Marca.findAll({ order: [['nombre', 'ASC']] });
  res.json(marcas);
});

router.post('/staff/marcas', onlyInventario, async (req, res) => {
  const { nombre } = req.body;
  if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'nombre es requerido' });
  const existente = await db.Marca.findOne({ where: { nombre: nombre.trim() } });
  if (existente) return res.status(409).json({ error: 'Ya existe una marca con ese nombre' });
  const marca = await db.Marca.create({ nombre: nombre.trim() });
  res.status(201).json(marca);
});

router.delete('/staff/marcas/:id', onlyInventario, async (req, res) => {
  const marca = await db.Marca.findByPk(req.params.id);
  if (!marca) return res.status(404).json({ error: 'Marca no encontrada' });
  const enUso = await db.Producto.count({ where: { marca_id: marca.id } });
  if (enUso > 0) return res.status(409).json({ error: 'No se puede eliminar: hay productos con esta marca' });
  await marca.destroy();
  res.status(204).end();
});

// --- Categorias de producto ---

router.get('/staff/categorias-producto', onlyInventario, async (req, res) => {
  const categorias = await db.CategoriaProducto.findAll({ order: [['nombre', 'ASC']] });
  res.json(categorias);
});

router.post('/staff/categorias-producto', onlyInventario, async (req, res) => {
  const { nombre } = req.body;
  if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'nombre es requerido' });
  const existente = await db.CategoriaProducto.findOne({ where: { nombre: nombre.trim() } });
  if (existente) return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
  const categoria = await db.CategoriaProducto.create({ nombre: nombre.trim() });
  res.status(201).json(categoria);
});

router.delete('/staff/categorias-producto/:id', onlyInventario, async (req, res) => {
  const categoria = await db.CategoriaProducto.findByPk(req.params.id);
  if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });
  const enUso = await db.Producto.count({ where: { categoria_id: categoria.id } });
  if (enUso > 0) return res.status(409).json({ error: 'No se puede eliminar: hay productos con esta categoría' });
  await categoria.destroy();
  res.status(204).end();
});

// --- Productos ---

router.get('/staff/productos', onlyInventario, async (req, res) => {
  const { q } = req.query;
  const where = q ? { nombre: { [Op.like]: `%${q}%` } } : {};
  const productos = await db.Producto.findAll({
    where,
    include: [db.Marca, db.CategoriaProducto],
    order: [['nombre', 'ASC']],
  });
  res.json(productos);
});

router.post('/staff/productos', onlyInventario, async (req, res) => {
  const { nombre, marcaId, categoriaId, unidad, stock, stock_minimo, precio_venta, precio_costo, lote, fecha_vencimiento } = req.body;
  if (!nombre || precio_venta === undefined) {
    return res.status(400).json({ error: 'nombre y precio_venta son requeridos' });
  }
  const producto = await db.Producto.create({
    nombre,
    marca_id: marcaId || null,
    categoria_id: categoriaId || null,
    unidad: unidad || 'unidad',
    stock: stock || 0,
    stock_minimo: stock_minimo || 0,
    precio_venta,
    precio_costo: precio_costo || null,
    lote: lote || null,
    fecha_vencimiento: fecha_vencimiento || null,
  });
  const conRelaciones = await db.Producto.findByPk(producto.id, { include: [db.Marca, db.CategoriaProducto] });
  res.status(201).json(conRelaciones);
});

router.patch('/staff/productos/:id', onlyInventario, async (req, res) => {
  const producto = await db.Producto.findByPk(req.params.id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

  const { marcaId, categoriaId, ...resto } = req.body;
  if (marcaId !== undefined) producto.marca_id = marcaId || null;
  if (categoriaId !== undefined) producto.categoria_id = categoriaId || null;

  const campos = ['nombre', 'unidad', 'stock', 'stock_minimo', 'precio_venta', 'precio_costo', 'lote', 'fecha_vencimiento', 'activo'];
  campos.forEach((campo) => {
    if (resto[campo] !== undefined) producto[campo] = resto[campo];
  });

  await producto.save();
  const conRelaciones = await db.Producto.findByPk(producto.id, { include: [db.Marca, db.CategoriaProducto] });
  res.json(conRelaciones);
});

router.delete('/staff/productos/:id', onlyInventario, async (req, res) => {
  const producto = await db.Producto.findByPk(req.params.id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

  const enVentas = await db.VentaItem.count({ where: { producto_id: producto.id } });
  if (enVentas > 0) {
    return res.status(409).json({ error: 'No se puede eliminar: el producto tiene ventas registradas. Desactívalo en su lugar.' });
  }

  borrarImagenProducto(producto.imagen_url);
  await producto.destroy();
  res.status(204).end();
});

router.post('/staff/productos/:id/imagen', onlyInventario, async (req, res) => {
  const producto = await db.Producto.findByPk(req.params.id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

  uploadImagenProducto.single('imagen')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    borrarImagenProducto(producto.imagen_url);
    producto.imagen_url = `/uploads/productos/${req.file.filename}`;
    await producto.save();
    res.json(producto);
  });
});

router.delete('/staff/productos/:id/imagen', onlyInventario, async (req, res) => {
  const producto = await db.Producto.findByPk(req.params.id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

  borrarImagenProducto(producto.imagen_url);
  producto.imagen_url = null;
  await producto.save();
  res.json(producto);
});

// --- Activos de la clinica ---

router.get('/staff/activos', onlyInventario, async (req, res) => {
  const { q } = req.query;
  const where = q ? { nombre: { [Op.like]: `%${q}%` } } : {};
  const activos = await db.ActivoClinica.findAll({ where, order: [['nombre', 'ASC']] });
  res.json(activos);
});

router.post('/staff/activos', onlyInventario, async (req, res) => {
  const { nombre, categoria, marca, modelo, numero_serie, ubicacion, fecha_adquisicion, valor_adquisicion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });

  const activo = await db.ActivoClinica.create({
    nombre,
    categoria: categoria || null,
    marca: marca || null,
    modelo: modelo || null,
    numero_serie: numero_serie || null,
    ubicacion: ubicacion || null,
    fecha_adquisicion: fecha_adquisicion || null,
    valor_adquisicion: valor_adquisicion || null,
  });
  res.status(201).json(activo);
});

router.patch('/staff/activos/:id', onlyInventario, async (req, res) => {
  const activo = await db.ActivoClinica.findByPk(req.params.id);
  if (!activo) return res.status(404).json({ error: 'Activo no encontrado' });
  if (activo.estado === 'dado_de_baja') {
    return res.status(400).json({ error: 'Este activo está dado de baja y no se puede editar' });
  }

  const campos = ['nombre', 'categoria', 'marca', 'modelo', 'numero_serie', 'ubicacion', 'fecha_adquisicion', 'valor_adquisicion', 'estado'];
  campos.forEach((campo) => {
    if (req.body[campo] !== undefined) activo[campo] = req.body[campo];
  });
  if (req.body.estado === 'dado_de_baja') {
    return res.status(400).json({ error: 'Usa el endpoint de baja para dar de baja un activo' });
  }

  await activo.save();
  res.json(activo);
});

router.post('/staff/activos/:id/baja', onlyInventario, async (req, res) => {
  const activo = await db.ActivoClinica.findByPk(req.params.id);
  if (!activo) return res.status(404).json({ error: 'Activo no encontrado' });
  if (activo.estado === 'dado_de_baja') return res.status(400).json({ error: 'Este activo ya está dado de baja' });

  const { motivo } = req.body;
  if (!motivo) return res.status(400).json({ error: 'motivo es requerido' });

  activo.estado = 'dado_de_baja';
  activo.fecha_baja = new Date().toISOString().slice(0, 10);
  activo.motivo_baja = motivo;
  await activo.save();
  res.json(activo);
});

router.delete('/staff/activos/:id', onlyInventario, async (req, res) => {
  const activo = await db.ActivoClinica.findByPk(req.params.id);
  if (!activo) return res.status(404).json({ error: 'Activo no encontrado' });
  borrarImagenActivo(activo.imagen_url);
  await activo.destroy();
  res.status(204).end();
});

router.post('/staff/activos/:id/imagen', onlyInventario, async (req, res) => {
  const activo = await db.ActivoClinica.findByPk(req.params.id);
  if (!activo) return res.status(404).json({ error: 'Activo no encontrado' });

  uploadImagenActivo.single('imagen')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    borrarImagenActivo(activo.imagen_url);
    activo.imagen_url = `/uploads/activos/${req.file.filename}`;
    await activo.save();
    res.json(activo);
  });
});

router.delete('/staff/activos/:id/imagen', onlyInventario, async (req, res) => {
  const activo = await db.ActivoClinica.findByPk(req.params.id);
  if (!activo) return res.status(404).json({ error: 'Activo no encontrado' });

  borrarImagenActivo(activo.imagen_url);
  activo.imagen_url = null;
  await activo.save();
  res.json(activo);
});

module.exports = router;

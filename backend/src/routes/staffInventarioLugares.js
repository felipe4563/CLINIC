const express = require('express');
const ExcelJS = require('exceljs');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');

// Inventario por lugar: el material de la oficina como lo lleva la clínica en
// sus planillas (consultorio 2, sala, baños...), separado por tipo.
const router = express.Router();
const onlyInventario = requirePermiso('inventario');

const ETIQUETA_TIPO = { equipamiento: 'Equipamiento', equipos: 'Equipos', insumos: 'Insumos', activos: 'Activos', decorativos: 'Decorativos' };
const ETIQUETA_ESTADO = { bueno: 'Bueno', mantenimiento: 'En mantenimiento', baja: 'Dado de baja' };
const ORDEN = [['orden', 'ASC'], ['id', 'ASC']];

class ErrorDato extends Error {}

function texto(valor, campo, { requerido = false, max = 500 } = {}) {
  if (valor === undefined) return undefined;
  if (valor === null || valor === '') {
    if (requerido) throw new ErrorDato(`${campo} es requerido`);
    return null;
  }
  if (typeof valor !== 'string') throw new ErrorDato(`${campo} debe ser texto`);
  const limpio = valor.trim();
  if (requerido && !limpio) throw new ErrorDato(`${campo} es requerido`);
  if (limpio.length > max) throw new ErrorDato(`${campo} admite hasta ${max} caracteres`);
  return limpio || null;
}

// Valida los campos de un ítem; con `parcial` solo los que vienen.
function datosItem(body, { parcial = false } = {}) {
  const d = {};
  const nombre = texto(body.nombre, 'nombre', { requerido: !parcial || body.nombre !== undefined });
  if (nombre !== undefined) d.nombre = nombre;
  if (body.tipo !== undefined || !parcial) {
    if (!db.InventarioItem.TIPOS.includes(body.tipo)) throw new ErrorDato('tipo inválido');
    d.tipo = body.tipo;
  }
  if (body.cantidad !== undefined) {
    if (body.cantidad === null || body.cantidad === '') d.cantidad = null;
    else {
      const n = Number(body.cantidad);
      if (!Number.isInteger(n) || n < 0 || n > 100000) throw new ErrorDato('cantidad debe ser un número entero de 0 en adelante');
      d.cantidad = n;
    }
  }
  if (body.estado !== undefined) {
    if (!db.InventarioItem.ESTADOS.includes(body.estado)) throw new ErrorDato('estado inválido');
    d.estado = body.estado;
  }
  if (body.fecha_ingreso !== undefined) {
    if (body.fecha_ingreso === null || body.fecha_ingreso === '') d.fecha_ingreso = null;
    else if (typeof body.fecha_ingreso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.fecha_ingreso) || Number.isNaN(Date.parse(body.fecha_ingreso))) {
      throw new ErrorDato('fecha_ingreso debe ser una fecha YYYY-MM-DD');
    } else d.fecha_ingreso = body.fecha_ingreso;
  }
  const observacion = texto(body.observacion, 'observacion', { max: 2000 });
  if (observacion !== undefined) d.observacion = observacion;
  return d;
}

// "2 años 3 meses" desde la fecha de ingreso hasta hoy ('' sin fecha).
function tiempoDeUso(fechaIngreso, hoy = new Date()) {
  if (!fechaIngreso) return '';
  const [a, m, d] = fechaIngreso.split('-').map(Number);
  let meses = (hoy.getFullYear() - a) * 12 + (hoy.getMonth() + 1 - m);
  if (hoy.getDate() < d) meses -= 1;
  if (meses < 1) return 'Menos de 1 mes';
  const anios = Math.floor(meses / 12);
  const resto = meses % 12;
  const partes = [];
  if (anios) partes.push(`${anios} ${anios === 1 ? 'año' : 'años'}`);
  if (resto) partes.push(`${resto} ${resto === 1 ? 'mes' : 'meses'}`);
  return partes.join(' ');
}

const conManejo = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (err instanceof ErrorDato) return res.status(400).json({ error: err.message });
    if (err.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'Ya existe un lugar con ese nombre' });
    throw err;
  }
};

router.get('/staff/inventario/lugares', onlyInventario, async (req, res) => {
  const lugares = await db.InventarioLugar.findAll({ include: [{ model: db.InventarioItem }], order: [...ORDEN, [db.InventarioItem, 'orden', 'ASC'], [db.InventarioItem, 'id', 'ASC']] });
  res.json(lugares);
});

router.post('/staff/inventario/lugares', onlyInventario, conManejo(async (req, res) => {
  const nombre = texto(req.body.nombre, 'nombre', { requerido: true, max: 255 });
  const ultimo = await db.InventarioLugar.max('orden');
  const lugar = await db.InventarioLugar.create({ nombre, orden: (ultimo || 0) + 1 });
  res.status(201).json({ ...lugar.toJSON(), InventarioItems: [] });
}));

router.patch('/staff/inventario/lugares/:id', onlyInventario, conManejo(async (req, res) => {
  const lugar = await db.InventarioLugar.findByPk(req.params.id);
  if (!lugar) return res.status(404).json({ error: 'Lugar no encontrado' });
  lugar.nombre = texto(req.body.nombre, 'nombre', { requerido: true, max: 255 });
  await lugar.save();
  res.json(lugar);
}));

// Solo se borra un lugar vacío: así no se pierde inventario por error.
router.delete('/staff/inventario/lugares/:id', onlyInventario, async (req, res) => {
  const lugar = await db.InventarioLugar.findByPk(req.params.id);
  if (!lugar) return res.status(404).json({ error: 'Lugar no encontrado' });
  if (await db.InventarioItem.count({ where: { lugar_id: lugar.id } })) {
    return res.status(409).json({ error: 'El lugar tiene cosas cargadas: muévelas o bórralas primero' });
  }
  await lugar.destroy();
  res.status(204).end();
});

router.post('/staff/inventario/items', onlyInventario, conManejo(async (req, res) => {
  const lugar = await db.InventarioLugar.findByPk(req.body.lugar_id);
  if (!lugar) return res.status(400).json({ error: 'Lugar no encontrado' });
  const datos = datosItem(req.body);
  const ultimo = await db.InventarioItem.max('orden', { where: { lugar_id: lugar.id } });
  const item = await db.InventarioItem.create({ ...datos, lugar_id: lugar.id, orden: (ultimo || 0) + 1 });
  res.status(201).json(item);
}));

router.patch('/staff/inventario/items/:id', onlyInventario, conManejo(async (req, res) => {
  const item = await db.InventarioItem.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: 'No encontrado' });
  const datos = datosItem(req.body, { parcial: true });
  if (req.body.lugar_id !== undefined && Number(req.body.lugar_id) !== item.lugar_id) {
    const lugar = await db.InventarioLugar.findByPk(req.body.lugar_id);
    if (!lugar) return res.status(400).json({ error: 'Lugar no encontrado' });
    datos.lugar_id = lugar.id;
    datos.orden = ((await db.InventarioItem.max('orden', { where: { lugar_id: lugar.id } })) || 0) + 1;
  }
  await item.update(datos);
  res.json(item);
}));

router.delete('/staff/inventario/items/:id', onlyInventario, async (req, res) => {
  const item = await db.InventarioItem.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: 'No encontrado' });
  await item.destroy();
  res.status(204).end();
});

// Planilla Excel: una hoja por lugar (o solo el lugar pedido), por tipo y en su orden.
router.get('/staff/inventario/excel', onlyInventario, async (req, res) => {
  const where = req.query.lugar_id ? { id: req.query.lugar_id } : {};
  const lugares = await db.InventarioLugar.findAll({ where, include: [{ model: db.InventarioItem }], order: [...ORDEN, [db.InventarioItem, 'orden', 'ASC'], [db.InventarioItem, 'id', 'ASC']] });
  if (req.query.lugar_id && !lugares.length) return res.status(404).json({ error: 'Lugar no encontrado' });

  const libro = new ExcelJS.Workbook();
  libro.creator = 'Clinic NovagED';
  const usados = new Set();
  for (const lugar of lugares) {
    // Excel: nombres de hoja de hasta 31 caracteres, sin \ / ? * [ ] : y únicos.
    let nombreHoja = lugar.nombre.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Lugar';
    for (let n = 2; usados.has(nombreHoja.toLowerCase()); n += 1) nombreHoja = `${nombreHoja.slice(0, 27)} (${n})`;
    usados.add(nombreHoja.toLowerCase());
    const hoja = libro.addWorksheet(nombreHoja);
    hoja.columns = [
      { header: 'Cantidad', key: 'cantidad', width: 10 },
      { header: 'Nombre', key: 'nombre', width: 60 },
      { header: 'Estado', key: 'estado', width: 18 },
      { header: 'Fecha de ingreso', key: 'fecha_ingreso', width: 16 },
      { header: 'Tiempo de uso', key: 'tiempo', width: 18 },
      { header: 'Observación', key: 'observacion', width: 40 },
    ];
    hoja.spliceRows(1, 0, [`INVENTARIO ${lugar.nombre.toUpperCase()}`]);
    hoja.getRow(1).font = { bold: true, size: 14 };
    hoja.getRow(2).font = { bold: true };
    for (const tipo of db.InventarioItem.TIPOS) {
      const items = lugar.InventarioItems.filter((i) => i.tipo === tipo);
      if (!items.length) continue;
      const titulo = hoja.addRow([ETIQUETA_TIPO[tipo].toUpperCase()]);
      titulo.font = { bold: true };
      titulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1E9E4' } };
      for (const i of items) {
        hoja.addRow({
          cantidad: i.cantidad, nombre: i.nombre, estado: ETIQUETA_ESTADO[i.estado], fecha_ingreso: i.fecha_ingreso ? i.fecha_ingreso.split('-').reverse().join('/') : '',
          tiempo: tiempoDeUso(i.fecha_ingreso), observacion: i.observacion || '',
        });
      }
    }
  }
  if (!lugares.length) libro.addWorksheet('Inventario');

  // Nombre de archivo en ASCII (sin tildes ni espacios) para que todos los navegadores lo respeten.
  const base = lugares.length === 1 && req.query.lugar_id ? `inventario-${lugares[0].nombre}` : 'inventario';
  const nombre = base.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${nombre}.xlsx"`);
  await libro.xlsx.write(res);
  res.end();
});

module.exports = router;
module.exports.tiempoDeUso = tiempoDeUso;

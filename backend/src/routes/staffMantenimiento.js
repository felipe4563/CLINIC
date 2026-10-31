const express = require('express');
const { Op } = require('sequelize');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');

// Mantenimiento de muebles y equipos (pestaña Mantenimiento en Inventario): se manda
// una cantidad de un ítem del inventario por lugar con su fecha de salida, y al
// recogerlo se anota la fecha de regreso y el costo, que sale de caja.
const router = express.Router();
// Vive en Inventario; Ventas lo conserva para no cortar a quien ya lo usaba.
const onlyVentas = requirePermiso(['inventario', 'ventas']);

class ErrorDato extends Error {}

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fecha(valor, campo) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor) || Number.isNaN(Date.parse(valor))) {
    throw new ErrorDato(`${campo} debe ser una fecha válida`);
  }
  if (valor > hoyISO()) throw new ErrorDato(`${campo} no puede ser una fecha futura`);
  return valor;
}

function texto(valor, campo, max) {
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== 'string') throw new ErrorDato(`${campo} debe ser texto`);
  const limpio = valor.trim();
  if (limpio.length > max) throw new ErrorDato(`${campo} admite hasta ${max} caracteres`);
  return limpio || null;
}

const conManejo = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (err instanceof ErrorDato) return res.status(400).json({ error: err.message });
    throw err;
  }
};

// Unidades de cada ítem que están fuera ahora mismo.
async function fueraPorItem(ids, transaction) {
  const where = { fecha_regreso: null };
  if (ids) where.inventario_item_id = ids;
  const filas = await db.MantenimientoEquipo.findAll({
    where,
    attributes: ['inventario_item_id', [db.sequelize.fn('SUM', db.sequelize.col('cantidad')), 'fuera']],
    group: ['inventario_item_id'],
    raw: true,
    transaction,
  });
  return Object.fromEntries(filas.map((f) => [f.inventario_item_id, Number(f.fuera)]));
}

// Un ítem sin cantidad en la planilla cuenta como una unidad.
const unidades = (item) => (item.cantidad === null ? 1 : item.cantidad);

const INCLUIR_ITEM = { model: db.InventarioItem, attributes: ['id', 'nombre', 'tipo', 'cantidad'], include: [{ model: db.InventarioLugar, attributes: ['id', 'nombre'] }] };

router.get('/staff/mantenimientos', onlyVentas, async (req, res) => {
  const incluir = [
    INCLUIR_ITEM,
    { model: db.Usuario, as: 'UsuarioSalida', attributes: ['nombre'] },
    { model: db.Usuario, as: 'UsuarioRegreso', attributes: ['nombre'] },
  ];
  const enCurso = await db.MantenimientoEquipo.findAll({ where: { fecha_regreso: null }, include: incluir, order: [['fecha_salida', 'ASC'], ['id', 'ASC']] });
  const historial = await db.MantenimientoEquipo.findAll({
    where: { fecha_regreso: { [Op.ne]: null } },
    include: incluir,
    order: [['fecha_regreso', 'DESC'], ['id', 'DESC']],
    limit: 100,
  });
  res.json({ enCurso, historial });
});

// Muebles y equipos que se pueden mandar, con cuántas unidades quedan en la clínica.
router.get('/staff/mantenimientos/equipos', onlyVentas, async (req, res) => {
  const items = await db.InventarioItem.findAll({
    where: { tipo: db.MantenimientoEquipo.TIPOS_ITEM, estado: { [Op.ne]: 'baja' } },
    attributes: ['id', 'nombre', 'tipo', 'cantidad'],
    include: [{ model: db.InventarioLugar, attributes: ['id', 'nombre', 'orden'] }],
    order: [[db.InventarioLugar, 'orden', 'ASC'], [db.InventarioLugar, 'id', 'ASC'], ['orden', 'ASC'], ['id', 'ASC']],
  });
  const fuera = await fueraPorItem();
  res.json(
    items
      .map((i) => ({ ...i.toJSON(), disponibles: unidades(i) - (fuera[i.id] || 0) }))
      .filter((i) => i.disponibles > 0),
  );
});

router.post('/staff/mantenimientos', onlyVentas, conManejo(async (req, res) => {
  const cantidad = Number(req.body.cantidad ?? 1);
  if (!Number.isInteger(cantidad) || cantidad < 1) throw new ErrorDato('cantidad debe ser un número entero desde 1');
  const fechaSalida = fecha(req.body.fechaSalida, 'La fecha de salida');
  const motivo = texto(req.body.motivo, 'motivo', 2000);
  const destino = texto(req.body.destino, 'destino', 255);

  const resultado = await db.sequelize.transaction(async (transaction) => {
    const item = await db.InventarioItem.findByPk(req.body.inventarioItemId, { lock: transaction.LOCK.UPDATE, transaction });
    if (!item) return { status: 404, error: 'Equipo no encontrado en el inventario' };
    if (!db.MantenimientoEquipo.TIPOS_ITEM.includes(item.tipo)) return { status: 400, error: 'Solo los muebles y equipos van a mantenimiento' };
    if (item.estado === 'baja') return { status: 400, error: 'Ese equipo está dado de baja' };
    const disponibles = unidades(item) - ((await fueraPorItem([item.id], transaction))[item.id] || 0);
    if (cantidad > disponibles) {
      return { status: 409, error: disponibles > 0 ? `Solo quedan ${disponibles} en la clínica` : 'Ya está todo en mantenimiento' };
    }
    const registro = await db.MantenimientoEquipo.create({
      inventario_item_id: item.id, cantidad, fecha_salida: fechaSalida, motivo, destino, usuario_salida_id: req.usuarioId,
    }, { transaction });
    // Si salieron todas las unidades, en el inventario figura "En mantenimiento".
    if (cantidad === disponibles) await item.update({ estado: 'mantenimiento' }, { transaction });
    return { registro };
  });
  if (resultado.error) return res.status(resultado.status).json({ error: resultado.error });
  res.status(201).json(await db.MantenimientoEquipo.findByPk(resultado.registro.id, { include: [INCLUIR_ITEM] }));
}));

// Se recogió: vuelve al inventario; el costo (si hubo) sale de caja ese día.
router.post('/staff/mantenimientos/:id/regreso', onlyVentas, conManejo(async (req, res) => {
  const fechaRegreso = fecha(req.body.fechaRegreso, 'La fecha de regreso');
  const trabajo = texto(req.body.trabajoRealizado, 'trabajo realizado', 2000);
  let costo = null;
  if (req.body.costo !== undefined && req.body.costo !== null && req.body.costo !== '') {
    costo = Number(req.body.costo);
    if (!Number.isFinite(costo) || costo < 0 || costo > 1000000) throw new ErrorDato('El costo debe ser un monto en Bs');
    costo = Math.round(costo * 100) / 100;
  }

  const resultado = await db.sequelize.transaction(async (transaction) => {
    const registro = await db.MantenimientoEquipo.findByPk(req.params.id, { include: [INCLUIR_ITEM], lock: transaction.LOCK.UPDATE, transaction });
    if (!registro) return { status: 404, error: 'No encontrado' };
    if (registro.fecha_regreso) return { status: 409, error: 'Ese equipo ya se recogió' };
    if (fechaRegreso < registro.fecha_salida) return { status: 400, error: 'La fecha de regreso no puede ser anterior a la de salida' };

    let movimiento = null;
    if (costo > 0) {
      const item = registro.InventarioItem;
      movimiento = await db.MovimientoCaja.create({
        tipo: 'egreso',
        concepto: `Mantenimiento: ${item.nombre}${registro.cantidad > 1 ? ` (${registro.cantidad})` : ''} - ${item.InventarioLugar.nombre}`.slice(0, 255),
        monto: costo,
        fecha: fechaRegreso,
        usuario_id: req.usuarioId,
      }, { transaction });
    }
    await registro.update({
      fecha_regreso: fechaRegreso, trabajo_realizado: trabajo, costo, movimiento_caja_id: movimiento ? movimiento.id : null, usuario_regreso_id: req.usuarioId,
    }, { transaction });

    // Si ya no queda nada afuera, el ítem vuelve a "Bueno".
    const quedanFuera = (await fueraPorItem([registro.inventario_item_id], transaction))[registro.inventario_item_id] || 0;
    if (!quedanFuera) {
      await db.InventarioItem.update({ estado: 'bueno' }, { where: { id: registro.inventario_item_id, estado: 'mantenimiento' }, transaction });
    }
    return { registro };
  });
  if (resultado.error) return res.status(resultado.status).json({ error: resultado.error });
  res.json(resultado.registro);
}));

// Se anotó por error: solo mientras sigue afuera (después ya movió caja).
router.delete('/staff/mantenimientos/:id', onlyVentas, async (req, res) => {
  const registro = await db.MantenimientoEquipo.findByPk(req.params.id);
  if (!registro) return res.status(404).json({ error: 'No encontrado' });
  if (registro.fecha_regreso) return res.status(409).json({ error: 'Ya se recogió; no se puede borrar' });
  await db.sequelize.transaction(async (transaction) => {
    await registro.destroy({ transaction });
    const quedanFuera = (await fueraPorItem([registro.inventario_item_id], transaction))[registro.inventario_item_id] || 0;
    if (!quedanFuera) {
      await db.InventarioItem.update({ estado: 'bueno' }, { where: { id: registro.inventario_item_id, estado: 'mantenimiento' }, transaction });
    }
  });
  res.status(204).end();
});

module.exports = router;
module.exports.fueraPorItem = fueraPorItem;

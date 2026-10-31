const express = require('express');
const { Op } = require('sequelize');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');

const router = express.Router();
const onlyCaja = requirePermiso('caja');

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const esFecha = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const MAX_DIAS_RANGO = 366;

// De dónde salió el movimiento, para mostrar su detalle.
function origenDe(m, conMantenimiento) {
  if (m.venta_id) return 'venta';
  if (m.compra_id) return 'compra';
  if (m.pago_id) return 'cita';
  if (m.paquete_sesiones_id) return 'paquete';
  if (conMantenimiento.has(m.id)) return 'mantenimiento';
  return 'manual';
}

// Un día (?fecha=) o un rango (?desde=&hasta=), lo más reciente primero.
// ?tipo=ingreso|egreso filtra la lista; los totales son siempre del periodo completo.
router.get('/staff/caja', onlyCaja, async (req, res) => {
  let { desde, hasta } = req.query;
  if (desde || hasta) {
    if (!esFecha(desde) || !esFecha(hasta)) return res.status(400).json({ error: 'desde y hasta deben ser fechas YYYY-MM-DD' });
    if (desde > hasta) [desde, hasta] = [hasta, desde];
    if ((Date.parse(hasta) - Date.parse(desde)) / 86400000 > MAX_DIAS_RANGO) {
      return res.status(400).json({ error: 'El rango puede ser de hasta un año' });
    }
  } else {
    const fecha = req.query.fecha || hoyISO();
    if (!esFecha(fecha)) return res.status(400).json({ error: 'fecha debe ser YYYY-MM-DD' });
    desde = fecha;
    hasta = fecha;
  }
  const { tipo } = req.query;
  if (tipo !== undefined && tipo !== '' && !['ingreso', 'egreso'].includes(tipo)) {
    return res.status(400).json({ error: 'tipo debe ser ingreso o egreso' });
  }

  const todos = await db.MovimientoCaja.findAll({
    where: { fecha: desde === hasta ? desde : { [Op.between]: [desde, hasta] } },
    include: [{ model: db.Usuario, attributes: ['id', 'nombre'] }],
    order: [['fecha', 'DESC'], ['id', 'DESC']],
  });

  const totalIngresos = todos.filter((m) => m.tipo === 'ingreso').reduce((acc, m) => acc + Number(m.monto), 0);
  const totalEgresos = todos.filter((m) => m.tipo === 'egreso').reduce((acc, m) => acc + Number(m.monto), 0);

  const ids = todos.map((m) => m.id);
  const conMantenimiento = new Set(
    ids.length
      ? (await db.MantenimientoEquipo.findAll({ where: { movimiento_caja_id: ids }, attributes: ['movimiento_caja_id'], raw: true })).map((r) => r.movimiento_caja_id)
      : [],
  );
  const movimientos = todos
    .filter((m) => !tipo || m.tipo === tipo)
    .map((m) => ({ ...m.toJSON(), origen: origenDe(m, conMantenimiento) }));

  res.json({
    fecha: desde,
    desde,
    hasta,
    movimientos,
    totalIngresos,
    totalEgresos,
    saldoNeto: totalIngresos - totalEgresos,
  });
});

// Detalle de un movimiento: qué se vendió, a quién se compró, qué equipo se arregló…
router.get('/staff/caja/:id/detalle', onlyCaja, async (req, res) => {
  const m = await db.MovimientoCaja.findByPk(req.params.id, { include: [{ model: db.Usuario, attributes: ['nombre'] }] });
  if (!m) return res.status(404).json({ error: 'Movimiento no encontrado' });
  const base = { id: m.id, tipo: m.tipo, concepto: m.concepto, monto: m.monto, fecha: m.fecha, registrado: m.createdAt, usuario: m.Usuario?.nombre || null };

  if (m.venta_id) {
    const v = await db.Venta.findByPk(m.venta_id, {
      include: [{ model: db.Paciente, attributes: ['nombre_completo'] }, { model: db.VentaItem, include: [{ model: db.Producto, attributes: ['nombre'] }] }],
    });
    return res.json({
      ...base,
      origen: 'venta',
      venta: v && {
        id: v.id,
        cliente: v.Paciente?.nombre_completo || v.cliente_nombre || 'Cliente mostrador',
        metodo_pago: v.metodo_pago,
        subtotal: v.subtotal,
        descuento_porcentaje: v.descuento_porcentaje,
        total: v.total,
        items: v.VentaItems.map((i) => ({ nombre: i.Producto?.nombre, cantidad: i.cantidad, precio_unitario: i.precio_unitario, subtotal: i.subtotal })),
      },
    });
  }
  if (m.compra_id) {
    const c = await db.Compra.findByPk(m.compra_id, {
      include: [{ model: db.Proveedor, attributes: ['nombre'] }, { model: db.CompraItem, include: [{ model: db.Producto, attributes: ['nombre'] }] }],
    });
    return res.json({
      ...base,
      origen: 'compra',
      compra: c && {
        id: c.id,
        proveedor: c.Proveedor?.nombre || null,
        nota: c.nota,
        total: c.total,
        items: c.CompraItems.map((i) => ({ nombre: i.Producto?.nombre, cantidad: i.cantidad, costo_unitario: i.costo_unitario, subtotal: i.subtotal, lote: i.lote, fecha_vencimiento: i.fecha_vencimiento })),
      },
    });
  }
  if (m.pago_id) {
    const p = await db.Pago.findByPk(m.pago_id, {
      include: [{ model: db.Cita, as: 'Cita', include: [{ model: db.Paciente, attributes: ['nombre_completo'] }, { model: db.Servicio, attributes: ['nombre'] }, { model: db.Profesional, attributes: ['nombre'] }] }],
    });
    return res.json({
      ...base,
      origen: 'cita',
      cita: p && {
        paciente: p.Cita?.Paciente?.nombre_completo || null,
        servicio: p.Cita?.Servicio?.nombre || null,
        profesional: p.Cita?.Profesional?.nombre || null,
        fecha: p.Cita?.fecha || null,
        hora: p.Cita?.hora_inicio || null,
        monto_total: p.monto_total,
        descuento: p.descuento,
        metodo_pago_saldo: p.metodo_pago_saldo,
      },
    });
  }
  if (m.paquete_sesiones_id) {
    const pq = await db.PaqueteSesiones.findByPk(m.paquete_sesiones_id, {
      include: [{ model: db.Paciente, attributes: ['nombre_completo'] }, { model: db.Servicio, attributes: ['nombre'] }],
    });
    return res.json({
      ...base,
      origen: 'paquete',
      paquete: pq && { paciente: pq.Paciente?.nombre_completo || null, servicio: pq.Servicio?.nombre || null, sesiones_totales: pq.sesiones_totales, sesiones_usadas: pq.sesiones_usadas, precio_total: pq.precio_total },
    });
  }
  const mant = await db.MantenimientoEquipo.findOne({
    where: { movimiento_caja_id: m.id },
    include: [{ model: db.InventarioItem, attributes: ['nombre'], include: [{ model: db.InventarioLugar, attributes: ['nombre'] }] }],
  });
  if (mant) {
    return res.json({
      ...base,
      origen: 'mantenimiento',
      mantenimiento: {
        equipo: mant.InventarioItem?.nombre || null,
        lugar: mant.InventarioItem?.InventarioLugar?.nombre || null,
        cantidad: mant.cantidad,
        destino: mant.destino,
        motivo: mant.motivo,
        trabajo_realizado: mant.trabajo_realizado,
        fecha_salida: mant.fecha_salida,
        fecha_regreso: mant.fecha_regreso,
      },
    });
  }
  res.json({ ...base, origen: 'manual' });
});

router.post('/staff/caja', onlyCaja, async (req, res) => {
  const { tipo, concepto, monto, fecha } = req.body;
  if (!['ingreso', 'egreso'].includes(tipo) || !concepto || !monto) {
    return res.status(400).json({ error: 'tipo (ingreso|egreso), concepto y monto son requeridos' });
  }

  const movimiento = await db.MovimientoCaja.create({
    tipo,
    concepto,
    monto,
    fecha: fecha || hoyISO(),
    usuario_id: req.usuarioId,
  });

  const conUsuario = await db.MovimientoCaja.findByPk(movimiento.id, {
    include: [{ model: db.Usuario, attributes: { exclude: ['password_hash'] } }],
  });
  res.status(201).json(conUsuario);
});

router.delete('/staff/caja/:id', onlyCaja, async (req, res) => {
  const movimiento = await db.MovimientoCaja.findByPk(req.params.id);
  if (!movimiento) return res.status(404).json({ error: 'Movimiento no encontrado' });
  // Solo se borra lo anotado a mano: lo automático se anula desde su origen
  // (la venta, la compra…), si no la caja deja de cuadrar con lo registrado.
  const enMantenimiento = await db.MantenimientoEquipo.count({ where: { movimiento_caja_id: movimiento.id } });
  const origen = origenDe(movimiento, new Set(enMantenimiento ? [movimiento.id] : []));
  if (origen !== 'manual') {
    const de = { venta: 'una venta', compra: 'una compra', cita: 'un cobro de cita', paquete: 'un paquete', mantenimiento: 'un mantenimiento' }[origen];
    return res.status(400).json({ error: `Este movimiento viene de ${de} y no se puede eliminar desde Caja` });
  }

  await movimiento.destroy();
  res.status(204).end();
});

module.exports = router;

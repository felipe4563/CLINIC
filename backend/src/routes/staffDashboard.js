const express = require('express');
const { Op } = require('sequelize');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');

const router = express.Router();

function pad(n) {
  return String(n).padStart(2, '0');
}

function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function rangoPeriodo(periodo, hoy) {
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();
  const dia = hoy.getDate();

  if (periodo === 'anio') {
    return { desde: toISODate(new Date(anio, 0, 1)), hasta: toISODate(new Date(anio, 11, 31)) };
  }
  if (periodo === 'dia') {
    const iso = toISODate(hoy);
    return { desde: iso, hasta: iso };
  }
  // default: mes
  return { desde: toISODate(new Date(anio, mes, 1)), hasta: toISODate(new Date(anio, mes + 1, 0)) };
}

router.get('/staff/dashboard', requirePermiso('dashboard'), async (req, res) => {
  const permisos = req.permisos || [];
  const puedeVerCaja = permisos.includes('caja');
  const puedeVerInventario = permisos.includes('inventario');
  const puedeVerVentas = permisos.includes('ventas');
  const puedeVerPacientes = permisos.includes('pacientes');

  const periodo = ['dia', 'mes', 'anio'].includes(req.query.periodo) ? req.query.periodo : 'mes';
  const hoy = new Date();
  const hoyISO = toISODate(hoy);
  const fechaRef = /^\d{4}-\d{2}-\d{2}$/.test(req.query.fecha || '') ? new Date(`${req.query.fecha}T00:00:00`) : hoy;
  const { desde, hasta } = rangoPeriodo(periodo, fechaRef);
  const treintaDias = toISODate(new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000));
  const finVentana = hasta < hoyISO ? hasta : hoyISO;
  const finVentanaDate = new Date(`${finVentana}T00:00:00`);
  const catorceDiasAtras = toISODate(new Date(finVentanaDate.getTime() - 13 * 24 * 60 * 60 * 1000));

  const [
    citasHoy,
    citasPeriodo,
    pacientesNuevos,
    pagosPeriodo,
    ventasPeriodo,
    proximasCitas,
    saldosPendientesRows,
    movimientosCajaHoy,
    ventasHoyRows,
    stockBajo,
    productosPorVencer,
    activosOperativos,
    activosMantenimiento,
    pacientesTotal,
    pagosPorDiaRows,
    ventasPorDiaRows,
    citasPorServicioRows,
  ] = await Promise.all([
    db.Cita.count({ where: { fecha: hoyISO, estado: { [Op.ne]: 'cancelada' } } }),
    db.Cita.count({ where: { fecha: { [Op.between]: [desde, hasta] }, estado: { [Op.ne]: 'cancelada' } } }),
    db.Paciente.count({ where: { createdAt: { [Op.gte]: new Date(`${desde}T00:00:00`) } } }),
    db.Pago.findAll({
      attributes: ['monto'],
      where: { estado: 'pagado' },
      include: [{ model: db.Cita, as: 'Cita', attributes: [], where: { fecha: { [Op.between]: [desde, hasta] } } }],
    }),
    puedeVerVentas
      ? db.Venta.findAll({ attributes: ['total'], where: { estado: 'pagado', fecha: { [Op.between]: [desde, hasta] } } })
      : [],
    db.Cita.findAll({
      where: { fecha: { [Op.gte]: hoyISO }, estado: { [Op.ne]: 'cancelada' } },
      include: [db.Paciente, db.Profesional, db.Servicio],
      order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']],
      limit: 5,
    }),
    db.Pago.findAll({
      attributes: ['monto', 'monto_total'],
      where: { porcentaje: 50, estado: 'pagado', saldo_cobrado: false },
    }),
    puedeVerCaja ? db.MovimientoCaja.findAll({ attributes: ['tipo', 'monto'], where: { fecha: hoyISO } }) : [],
    puedeVerVentas ? db.Venta.findAll({ attributes: ['total'], where: { estado: 'pagado', fecha: hoyISO } }) : [],
    puedeVerInventario
      ? db.Producto.count({ where: { activo: true, stock: { [Op.lte]: db.sequelize.col('stock_minimo') } } })
      : 0,
    puedeVerInventario
      ? db.CompraItem.count({
          distinct: true,
          col: 'producto_id',
          where: { fecha_vencimiento: { [Op.ne]: null, [Op.lte]: treintaDias } },
          include: [{ model: db.Producto, attributes: [], where: { activo: true } }],
        })
      : 0,
    puedeVerInventario ? db.ActivoClinica.count({ where: { estado: 'operativo' } }) : 0,
    puedeVerInventario ? db.ActivoClinica.count({ where: { estado: 'mantenimiento' } }) : 0,
    puedeVerPacientes ? db.Paciente.count() : 0,
    db.Pago.findAll({
      attributes: [[db.sequelize.col('Cita.fecha'), 'fecha'], [db.sequelize.fn('SUM', db.sequelize.col('Pago.monto')), 'total']],
      where: { estado: 'pagado' },
      include: [{ model: db.Cita, as: 'Cita', attributes: [], where: { fecha: { [Op.between]: [catorceDiasAtras, hoyISO] } } }],
      group: ['Cita.fecha'],
      raw: true,
    }),
    puedeVerVentas
      ? db.Venta.findAll({
          attributes: ['fecha', [db.sequelize.fn('SUM', db.sequelize.col('total')), 'total']],
          where: { estado: 'pagado', fecha: { [Op.between]: [catorceDiasAtras, hoyISO] } },
          group: ['fecha'],
          raw: true,
        })
      : [],
    db.Cita.findAll({
      attributes: [[db.sequelize.col('Servicio.nombre'), 'servicio'], [db.sequelize.fn('COUNT', db.sequelize.col('Cita.id')), 'cantidad']],
      where: { fecha: { [Op.between]: [desde, hasta] }, estado: { [Op.ne]: 'cancelada' } },
      include: [{ model: db.Servicio, attributes: [] }],
      group: ['Servicio.id', 'Servicio.nombre'],
      order: [[db.sequelize.literal('cantidad'), 'DESC']],
      raw: true,
    }),
  ]);

  const ingresosPeriodo =
    pagosPeriodo.reduce((sum, pago) => sum + Number(pago.monto), 0) +
    (puedeVerVentas ? ventasPeriodo.reduce((sum, venta) => sum + Number(venta.total), 0) : 0);

  const saldosPendientes = {
    cantidad: saldosPendientesRows.length,
    total: saldosPendientesRows.reduce((sum, pago) => sum + (Number(pago.monto_total) - Number(pago.monto)), 0),
  };

  const cajaHoy = movimientosCajaHoy.reduce(
    (acc, m) => {
      const monto = Number(m.monto);
      if (m.tipo === 'ingreso') acc.ingresos += monto;
      else acc.egresos += monto;
      acc.saldoNeto = acc.ingresos - acc.egresos;
      return acc;
    },
    { ingresos: 0, egresos: 0, saldoNeto: 0 },
  );

  const ventasHoy = {
    cantidad: ventasHoyRows.length,
    total: ventasHoyRows.reduce((sum, v) => sum + Number(v.total), 0),
  };

  const citasPorFecha = new Map(pagosPorDiaRows.map((r) => [r.fecha, Number(r.total)]));
  const ventasPorFecha = new Map(ventasPorDiaRows.map((r) => [r.fecha, Number(r.total)]));
  const ingresosPorDia = [];
  for (let i = 13; i >= 0; i--) {
    const fecha = toISODate(new Date(finVentanaDate.getTime() - i * 24 * 60 * 60 * 1000));
    const citas = citasPorFecha.get(fecha) || 0;
    const ventas = ventasPorFecha.get(fecha) || 0;
    ingresosPorDia.push({ fecha, citas, ventas, total: citas + ventas });
  }

  const citasPorServicio = citasPorServicioRows.map((r) => ({ servicio: r.servicio, cantidad: Number(r.cantidad) }));

  res.json({
    periodo,
    citasHoy,
    citasPeriodo,
    pacientesNuevos,
    ingresosPeriodo,
    proximasCitas,
    saldosPendientes,
    cajaHoy: puedeVerCaja ? cajaHoy : null,
    ventasHoy: puedeVerVentas ? ventasHoy : null,
    inventario: puedeVerInventario ? { stockBajo, porVencer: productosPorVencer } : null,
    activos: puedeVerInventario ? { operativos: activosOperativos, mantenimiento: activosMantenimiento } : null,
    pacientesTotal: puedeVerPacientes ? pacientesTotal : null,
    ingresosPorDia,
    citasPorServicio,
  });
});

module.exports = router;

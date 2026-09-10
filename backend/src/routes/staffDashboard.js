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

  const periodo = ['dia', 'mes', 'anio'].includes(req.query.periodo) ? req.query.periodo : 'mes';
  const hoy = new Date();
  const hoyISO = toISODate(hoy);
  const { desde, hasta } = rangoPeriodo(periodo, hoy);
  const treintaDias = toISODate(new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000));

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
      ? db.Producto.count({ where: { activo: true, fecha_vencimiento: { [Op.ne]: null, [Op.lte]: treintaDias } } })
      : 0,
    puedeVerInventario ? db.ActivoClinica.count({ where: { estado: 'operativo' } }) : 0,
    puedeVerInventario ? db.ActivoClinica.count({ where: { estado: 'mantenimiento' } }) : 0,
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
  });
});

module.exports = router;

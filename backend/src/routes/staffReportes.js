const express = require('express');
const { Op } = require('sequelize');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { crearReportePDF, dibujarTabla, formatoMoneda, formatoFecha } = require('../services/pdf');

const router = express.Router();
const onlyReportes = requirePermiso('reportes');

function pad(n) {
  return String(n).padStart(2, '0');
}

function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function rangoQuery(req) {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const desde = /^\d{4}-\d{2}-\d{2}$/.test(req.query.desde) ? req.query.desde : toISODate(inicioMes);
  const hasta = /^\d{4}-\d{2}-\d{2}$/.test(req.query.hasta) ? req.query.hasta : toISODate(hoy);
  return { desde, hasta };
}

function horasEntre(horaEntrada, horaSalida) {
  if (!horaEntrada || !horaSalida) return 0;
  const [h1, m1] = horaEntrada.split(':').map(Number);
  const [h2, m2] = horaSalida.split(':').map(Number);
  return Math.max(0, (h2 * 60 + m2 - (h1 * 60 + m1)) / 60);
}

// --------------------------------------------------------------------
// Financiero
// --------------------------------------------------------------------
async function datosFinanciero(desde, hasta) {
  const movimientos = await db.MovimientoCaja.findAll({
    where: { fecha: { [Op.between]: [desde, hasta] } },
    order: [['fecha', 'ASC']],
  });

  const porDiaMap = new Map();
  let totalIngresos = 0;
  let totalEgresos = 0;
  for (const m of movimientos) {
    const monto = Number(m.monto);
    if (m.tipo === 'ingreso') totalIngresos += monto;
    else totalEgresos += monto;
    if (!porDiaMap.has(m.fecha)) porDiaMap.set(m.fecha, { fecha: m.fecha, ingresos: 0, egresos: 0 });
    const dia = porDiaMap.get(m.fecha);
    if (m.tipo === 'ingreso') dia.ingresos += monto;
    else dia.egresos += monto;
  }

  return {
    desde,
    hasta,
    totalIngresos,
    totalEgresos,
    neto: totalIngresos - totalEgresos,
    porDia: Array.from(porDiaMap.values()).sort((a, b) => a.fecha.localeCompare(b.fecha)),
  };
}

router.get('/staff/reportes/financiero', onlyReportes, async (req, res) => {
  const { desde, hasta } = rangoQuery(req);
  res.json(await datosFinanciero(desde, hasta));
});

router.get('/staff/reportes/financiero/pdf', onlyReportes, async (req, res) => {
  const { desde, hasta } = rangoQuery(req);
  const datos = await datosFinanciero(desde, hasta);
  const config = await db.ConfiguracionClinica.obtenerConfig();

  const doc = crearReportePDF(res, config, {
    titulo: 'Reporte Financiero',
    nombreArchivo: `reporte-financiero-${desde}_${hasta}.pdf`,
    desde,
    hasta,
  });

  dibujarTabla(doc, {
    columnas: [
      { titulo: 'Fecha', ancho: 150 },
      { titulo: 'Ingresos', ancho: 150, align: 'right' },
      { titulo: 'Egresos', ancho: 150, align: 'right' },
      { titulo: 'Neto', ancho: 150, align: 'right' },
    ],
    filas: datos.porDia.map((d) => [
      formatoFecha(d.fecha),
      formatoMoneda(d.ingresos),
      formatoMoneda(d.egresos),
      formatoMoneda(d.ingresos - d.egresos),
    ]),
  });

  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text(`Total ingresos: ${formatoMoneda(datos.totalIngresos)}`);
  doc.text(`Total egresos: ${formatoMoneda(datos.totalEgresos)}`);
  doc.text(`Saldo neto: ${formatoMoneda(datos.neto)}`);
  doc.end();
});

// --------------------------------------------------------------------
// Citas
// --------------------------------------------------------------------
async function datosCitas(desde, hasta) {
  const citas = await db.Cita.findAll({
    where: { fecha: { [Op.between]: [desde, hasta] } },
    include: [db.Profesional, db.Servicio],
  });

  const porEstado = { pendiente_pago: 0, confirmada: 0, cancelada: 0, completada: 0, no_asistio: 0 };
  const porProfesionalMap = new Map();
  const porServicioMap = new Map();

  for (const c of citas) {
    porEstado[c.estado] = (porEstado[c.estado] || 0) + 1;

    const nombreProfesional = c.Profesional ? c.Profesional.nombre : 'Sin profesional';
    porProfesionalMap.set(nombreProfesional, (porProfesionalMap.get(nombreProfesional) || 0) + 1);

    const nombreServicio = c.Servicio ? c.Servicio.nombre : 'Sin servicio';
    porServicioMap.set(nombreServicio, (porServicioMap.get(nombreServicio) || 0) + 1);
  }

  const total = citas.length;
  const noShowRate = total > 0 ? (porEstado.no_asistio / total) * 100 : 0;

  return {
    desde,
    hasta,
    total,
    porEstado,
    noShowRate,
    porProfesional: Array.from(porProfesionalMap.entries()).map(([profesional, cantidad]) => ({ profesional, cantidad })).sort((a, b) => b.cantidad - a.cantidad),
    porServicio: Array.from(porServicioMap.entries()).map(([servicio, cantidad]) => ({ servicio, cantidad })).sort((a, b) => b.cantidad - a.cantidad),
  };
}

router.get('/staff/reportes/citas', onlyReportes, async (req, res) => {
  const { desde, hasta } = rangoQuery(req);
  res.json(await datosCitas(desde, hasta));
});

router.get('/staff/reportes/citas/pdf', onlyReportes, async (req, res) => {
  const { desde, hasta } = rangoQuery(req);
  const datos = await datosCitas(desde, hasta);
  const config = await db.ConfiguracionClinica.obtenerConfig();

  const doc = crearReportePDF(res, config, {
    titulo: 'Reporte de Citas',
    nombreArchivo: `reporte-citas-${desde}_${hasta}.pdf`,
    desde,
    hasta,
  });

  doc.font('Helvetica-Bold').fontSize(11).text(`Total de citas: ${datos.total}`);
  doc.font('Helvetica').fontSize(10).text(`Tasa de inasistencia: ${datos.noShowRate.toFixed(1)}%`);
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').fontSize(11).text('Por estado');
  dibujarTabla(doc, {
    columnas: [{ titulo: 'Estado', ancho: 300 }, { titulo: 'Cantidad', ancho: 300, align: 'right' }],
    filas: Object.entries(datos.porEstado).map(([estado, cantidad]) => [estado, cantidad]),
  });

  doc.font('Helvetica-Bold').fontSize(11).text('Por profesional');
  dibujarTabla(doc, {
    columnas: [{ titulo: 'Profesional', ancho: 300 }, { titulo: 'Citas', ancho: 300, align: 'right' }],
    filas: datos.porProfesional.map((p) => [p.profesional, p.cantidad]),
  });

  doc.font('Helvetica-Bold').fontSize(11).text('Por servicio');
  dibujarTabla(doc, {
    columnas: [{ titulo: 'Servicio', ancho: 300 }, { titulo: 'Citas', ancho: 300, align: 'right' }],
    filas: datos.porServicio.map((s) => [s.servicio, s.cantidad]),
  });

  doc.end();
});

// --------------------------------------------------------------------
// Pacientes
// --------------------------------------------------------------------
async function datosPacientes(desde, hasta) {
  const desdeInicio = new Date(`${desde}T00:00:00`);
  const hastaFin = new Date(`${hasta}T23:59:59`);

  const [nuevos, citasRango, saldosPendientesRows] = await Promise.all([
    db.Paciente.count({ where: { createdAt: { [Op.between]: [desdeInicio, hastaFin] } } }),
    db.Cita.findAll({
      where: { fecha: { [Op.between]: [desde, hasta] }, estado: { [Op.ne]: 'cancelada' } },
      include: [db.Paciente],
    }),
    db.Pago.findAll({
      where: { porcentaje: 50, estado: 'pagado', saldo_cobrado: false },
      include: [{ model: db.Cita, as: 'Cita', include: [db.Paciente] }],
    }),
  ]);

  const pacientesConCitaIds = new Set(citasRango.map((c) => c.paciente_id));
  const recurrentes = citasRango.reduce((set, c) => {
    if (c.Paciente && c.Paciente.createdAt < desdeInicio) set.add(c.paciente_id);
    return set;
  }, new Set()).size;

  const saldosPendientes = saldosPendientesRows
    .filter((p) => p.Cita && p.Cita.Paciente)
    .map((p) => ({
      paciente: p.Cita.Paciente.nombre_completo,
      monto: Number(p.monto_total) - Number(p.monto),
    }));

  return {
    desde,
    hasta,
    pacientesNuevos: nuevos,
    pacientesConCita: pacientesConCitaIds.size,
    pacientesRecurrentes: recurrentes,
    saldosPendientes,
    totalSaldoPendiente: saldosPendientes.reduce((sum, s) => sum + s.monto, 0),
  };
}

router.get('/staff/reportes/pacientes', onlyReportes, async (req, res) => {
  const { desde, hasta } = rangoQuery(req);
  res.json(await datosPacientes(desde, hasta));
});

router.get('/staff/reportes/pacientes/pdf', onlyReportes, async (req, res) => {
  const { desde, hasta } = rangoQuery(req);
  const datos = await datosPacientes(desde, hasta);
  const config = await db.ConfiguracionClinica.obtenerConfig();

  const doc = crearReportePDF(res, config, {
    titulo: 'Reporte de Pacientes',
    nombreArchivo: `reporte-pacientes-${desde}_${hasta}.pdf`,
    desde,
    hasta,
  });

  doc.font('Helvetica-Bold').fontSize(11);
  doc.text(`Pacientes nuevos: ${datos.pacientesNuevos}`);
  doc.text(`Pacientes atendidos: ${datos.pacientesConCita}`);
  doc.text(`Pacientes recurrentes: ${datos.pacientesRecurrentes}`);
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').fontSize(11).text('Saldos pendientes');
  dibujarTabla(doc, {
    columnas: [{ titulo: 'Paciente', ancho: 350 }, { titulo: 'Saldo', ancho: 150, align: 'right' }],
    filas: datos.saldosPendientes.map((s) => [s.paciente, formatoMoneda(s.monto)]),
  });
  doc.font('Helvetica-Bold').fontSize(11).text(`Total saldos pendientes: ${formatoMoneda(datos.totalSaldoPendiente)}`);

  doc.end();
});

// --------------------------------------------------------------------
// Ventas e inventario
// --------------------------------------------------------------------
async function datosVentas(desde, hasta) {
  const [ventas, stockBajo, productosActivos] = await Promise.all([
    db.Venta.findAll({
      where: { estado: 'pagado', fecha: { [Op.between]: [desde, hasta] } },
      include: [{ model: db.VentaItem, include: [db.Producto] }],
    }),
    db.Producto.findAll({ where: { activo: true, stock: { [Op.lte]: db.sequelize.col('stock_minimo') } } }),
    db.Producto.findAll({ where: { activo: true } }),
  ]);

  const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total), 0);

  const topProductosMap = new Map();
  for (const venta of ventas) {
    for (const item of venta.VentaItems || []) {
      const nombre = item.Producto ? item.Producto.nombre : 'Producto eliminado';
      if (!topProductosMap.has(nombre)) topProductosMap.set(nombre, { producto: nombre, cantidad: 0, subtotal: 0 });
      const acc = topProductosMap.get(nombre);
      acc.cantidad += item.cantidad;
      acc.subtotal += Number(item.subtotal);
    }
  }

  const valorizacionInventario = productosActivos.reduce(
    (sum, p) => sum + p.stock * Number(p.precio_costo ?? p.precio_venta),
    0,
  );

  return {
    desde,
    hasta,
    totalVentas,
    cantidadVentas: ventas.length,
    topProductos: Array.from(topProductosMap.values()).sort((a, b) => b.subtotal - a.subtotal).slice(0, 15),
    stockBajo: stockBajo.map((p) => ({ producto: p.nombre, stock: p.stock, stockMinimo: p.stock_minimo })),
    valorizacionInventario,
  };
}

router.get('/staff/reportes/ventas', onlyReportes, async (req, res) => {
  const { desde, hasta } = rangoQuery(req);
  res.json(await datosVentas(desde, hasta));
});

router.get('/staff/reportes/ventas/pdf', onlyReportes, async (req, res) => {
  const { desde, hasta } = rangoQuery(req);
  const datos = await datosVentas(desde, hasta);
  const config = await db.ConfiguracionClinica.obtenerConfig();

  const doc = crearReportePDF(res, config, {
    titulo: 'Reporte de Ventas e Inventario',
    nombreArchivo: `reporte-ventas-${desde}_${hasta}.pdf`,
    desde,
    hasta,
  });

  doc.font('Helvetica-Bold').fontSize(11);
  doc.text(`Total vendido: ${formatoMoneda(datos.totalVentas)}`);
  doc.text(`Cantidad de ventas: ${datos.cantidadVentas}`);
  doc.text(`Valorización de inventario activo: ${formatoMoneda(datos.valorizacionInventario)}`);
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').fontSize(11).text('Productos más vendidos');
  dibujarTabla(doc, {
    columnas: [
      { titulo: 'Producto', ancho: 250 },
      { titulo: 'Cantidad', ancho: 125, align: 'right' },
      { titulo: 'Subtotal', ancho: 125, align: 'right' },
    ],
    filas: datos.topProductos.map((p) => [p.producto, p.cantidad, formatoMoneda(p.subtotal)]),
  });

  doc.font('Helvetica-Bold').fontSize(11).text('Stock bajo');
  dibujarTabla(doc, {
    columnas: [
      { titulo: 'Producto', ancho: 250 },
      { titulo: 'Stock actual', ancho: 125, align: 'right' },
      { titulo: 'Stock mínimo', ancho: 125, align: 'right' },
    ],
    filas: datos.stockBajo.map((p) => [p.producto, p.stock, p.stockMinimo]),
  });

  doc.end();
});

// --------------------------------------------------------------------
// Personal
// --------------------------------------------------------------------
async function datosPersonal(desde, hasta) {
  const [registros, ausencias] = await Promise.all([
    db.RegistroAsistencia.findAll({
      where: { fecha: { [Op.between]: [desde, hasta] } },
      include: [db.Usuario],
    }),
    db.Ausencia.findAll({
      where: { fecha_desde: { [Op.lte]: hasta }, fecha_hasta: { [Op.gte]: desde } },
      include: [db.Usuario],
    }),
  ]);

  const porUsuario = new Map();
  function obtener(usuarioId, nombre) {
    if (!porUsuario.has(usuarioId)) {
      porUsuario.set(usuarioId, { usuario: nombre, diasTrabajados: 0, horasTrabajadas: 0, ausencias: [] });
    }
    return porUsuario.get(usuarioId);
  }

  for (const r of registros) {
    const acc = obtener(r.usuario_id, r.Usuario ? r.Usuario.nombre : `Usuario ${r.usuario_id}`);
    acc.diasTrabajados += 1;
    acc.horasTrabajadas += horasEntre(r.hora_entrada, r.hora_salida);
  }

  for (const a of ausencias) {
    const acc = obtener(a.usuario_id, a.Usuario ? a.Usuario.nombre : `Usuario ${a.usuario_id}`);
    acc.ausencias.push({ tipo: a.tipo, desde: a.fecha_desde, hasta: a.fecha_hasta, estado: a.estado });
  }

  return {
    desde,
    hasta,
    porEmpleado: Array.from(porUsuario.values())
      .map((e) => ({ ...e, horasTrabajadas: Math.round(e.horasTrabajadas * 10) / 10 }))
      .sort((a, b) => a.usuario.localeCompare(b.usuario)),
  };
}

router.get('/staff/reportes/personal', onlyReportes, async (req, res) => {
  const { desde, hasta } = rangoQuery(req);
  res.json(await datosPersonal(desde, hasta));
});

router.get('/staff/reportes/personal/pdf', onlyReportes, async (req, res) => {
  const { desde, hasta } = rangoQuery(req);
  const datos = await datosPersonal(desde, hasta);
  const config = await db.ConfiguracionClinica.obtenerConfig();

  const doc = crearReportePDF(res, config, {
    titulo: 'Reporte de Personal',
    nombreArchivo: `reporte-personal-${desde}_${hasta}.pdf`,
    desde,
    hasta,
  });

  dibujarTabla(doc, {
    columnas: [
      { titulo: 'Empleado', ancho: 200 },
      { titulo: 'Días trabajados', ancho: 130, align: 'right' },
      { titulo: 'Horas trabajadas', ancho: 130, align: 'right' },
      { titulo: 'Ausencias', ancho: 140, align: 'right' },
    ],
    filas: datos.porEmpleado.map((e) => [e.usuario, e.diasTrabajados, e.horasTrabajadas, e.ausencias.length]),
  });

  doc.end();
});

module.exports = router;

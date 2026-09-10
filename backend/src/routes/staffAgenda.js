const express = require('express');
const { Op } = require('sequelize');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { getSlotsDisponibles } = require('../services/disponibilidad');
const { enviarSiCorresponde } = require('../services/notificacionesAutomaticas');
const { crearReportePDF, dibujarTabla, formatoFecha } = require('../services/pdf');

const router = express.Router();

const PORCENTAJES_VALIDOS = [50, 100];

router.post('/staff/citas', requirePermiso('agenda'), async (req, res) => {
  const { pacienteId, profesionalId, servicioId, fecha, horaInicio, pagada, porcentajePago } = req.body;
  if (!pacienteId || !profesionalId || !servicioId || !fecha || !horaInicio) {
    return res.status(400).json({ error: 'pacienteId, profesionalId, servicioId, fecha y horaInicio son requeridos' });
  }
  const porcentaje = porcentajePago ? Number(porcentajePago) : 100;
  if (!PORCENTAJES_VALIDOS.includes(porcentaje)) {
    return res.status(400).json({ error: 'porcentajePago debe ser 50 o 100' });
  }

  const paciente = await db.Paciente.findByPk(pacienteId);
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

  const servicio = await db.Servicio.findByPk(servicioId);
  if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

  const slots = await getSlotsDisponibles({
    profesionalId: Number(profesionalId),
    servicioId: Number(servicioId),
    fecha,
  });
  const slot = slots.find((s) => s.hora_inicio === horaInicio);
  if (!slot) {
    return res.status(409).json({ error: 'El horario ya no esta disponible' });
  }

  const cita = await db.Cita.create({
    paciente_id: pacienteId,
    profesional_id: profesionalId,
    servicio_id: servicioId,
    fecha,
    hora_inicio: `${slot.hora_inicio}:00`,
    hora_fin: `${slot.hora_fin}:00`,
    estado: pagada ? 'confirmada' : 'pendiente_pago',
  });

  const montoTotal = Number(servicio.precio);
  const monto = Math.round(montoTotal * (porcentaje / 100) * 100) / 100;

  const pago = await db.Pago.create({
    cita_id: cita.id,
    monto,
    monto_total: montoTotal,
    porcentaje,
    estado: pagada ? 'pagado' : 'pendiente',
  });

  const citaCompleta = await db.Cita.findByPk(cita.id, { include: [db.Paciente, db.Profesional, db.Servicio] });
  res.status(201).json({ cita: citaCompleta, pago });
});

router.get('/staff/citas', requirePermiso('agenda'), async (req, res) => {
  const { fecha, desde, hasta, profesionalId } = req.query;
  const where = {};
  if (fecha) {
    where.fecha = fecha;
  } else if (desde && hasta) {
    where.fecha = { [Op.between]: [desde, hasta] };
  }
  if (profesionalId) where.profesional_id = profesionalId;

  const citas = await db.Cita.findAll({
    where,
    include: [db.Paciente, db.Profesional, db.Servicio],
    order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']],
  });
  res.json(citas);
});

const ESTADO_LABEL = {
  pendiente_pago: 'Pendiente de pago',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  completada: 'Completada',
  no_asistio: 'No asistió',
};

function pad(n) {
  return String(n).padStart(2, '0');
}

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

router.get('/staff/agenda/pdf', requirePermiso('agenda'), async (req, res) => {
  const { fecha, desde, hasta, profesionalId } = req.query;
  const esRango = !fecha && desde && hasta;
  const fechaDesde = esRango ? desde : fecha || hoyISO();
  const fechaHasta = esRango ? hasta : fechaDesde;

  const where = { fecha: esRango ? { [Op.between]: [fechaDesde, fechaHasta] } : fechaDesde };
  if (profesionalId) where.profesional_id = profesionalId;

  const citas = await db.Cita.findAll({
    where,
    include: [db.Paciente, db.Profesional, db.Servicio],
    order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']],
  });

  const config = await db.ConfiguracionClinica.obtenerConfig();
  const nombreArchivo = esRango
    ? `agenda-${fechaDesde}_${fechaHasta}.pdf`
    : `agenda-${fechaDesde}.pdf`;

  const doc = crearReportePDF(res, config, {
    titulo: esRango ? 'Agenda de Citas' : 'Agenda del Día',
    nombreArchivo,
    desde: fechaDesde,
    hasta: fechaHasta,
  });

  if (!esRango) {
    doc.font('Helvetica').fontSize(9).fillColor('#555555').text(formatoFecha(fechaDesde), { continued: false });
    doc.moveDown(0.5);
    doc.fillColor('#1a1a1a');
  }

  const columnas = esRango
    ? [
        { titulo: 'Fecha', ancho: 65 },
        { titulo: 'Hora', ancho: 50 },
        { titulo: 'Paciente', ancho: 120 },
        { titulo: 'Servicio', ancho: 105 },
        { titulo: 'Profesional', ancho: 95 },
        { titulo: 'Estado', ancho: 85 },
      ]
    : [
        { titulo: 'Hora', ancho: 55 },
        { titulo: 'Paciente', ancho: 130 },
        { titulo: 'Servicio', ancho: 115 },
        { titulo: 'Profesional', ancho: 105 },
        { titulo: 'Teléfono', ancho: 75 },
        { titulo: 'Estado', ancho: 90 },
      ];

  const filas = citas.map((c) => {
    const base = esRango ? [formatoFecha(c.fecha), c.hora_inicio.slice(0, 5)] : [c.hora_inicio.slice(0, 5)];
    const comunes = [
      c.Paciente ? c.Paciente.nombre_completo : 'Sin paciente',
      c.Servicio ? c.Servicio.nombre : 'Sin servicio',
      c.Profesional ? c.Profesional.nombre : 'Sin profesional',
    ];
    const cola = esRango ? [ESTADO_LABEL[c.estado] || c.estado] : [c.Paciente ? c.Paciente.telefono : '', ESTADO_LABEL[c.estado] || c.estado];
    return [...base, ...comunes, ...cola];
  });

  dibujarTabla(doc, { columnas, filas });

  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1a1a1a').text(`Total de citas: ${citas.length}`);

  doc.end();
});

const TEMPLATE_POR_ESTADO = {
  no_asistio: { tipo: 'no_show', template: () => process.env.WHATSAPP_NO_SHOW_TEMPLATE },
  completada: { tipo: 'post_consulta', template: () => process.env.WHATSAPP_POST_CONSULTA_TEMPLATE },
};

router.patch('/staff/citas/:id/estado', requirePermiso('agenda'), async (req, res) => {
  const { estado } = req.body;
  const estadosValidos = ['pendiente_pago', 'confirmada', 'cancelada', 'completada', 'no_asistio'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: 'estado invalido' });
  }

  const cita = await db.Cita.findByPk(req.params.id, { include: [db.Paciente] });
  if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });

  cita.estado = estado;
  await cita.save();

  const evento = TEMPLATE_POR_ESTADO[estado];
  if (evento) {
    try {
      await enviarSiCorresponde({
        tipo: evento.tipo,
        telefono: cita.Paciente.telefono,
        template: evento.template(),
        parametros: [cita.Paciente.nombre_completo],
        citaId: cita.id,
      });
    } catch (err) {
      console.error(`Error enviando notificacion automatica (${evento.tipo}) para cita ${cita.id}:`, err.message);
    }
  }

  res.json(cita);
});

module.exports = router;

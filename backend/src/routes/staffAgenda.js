const express = require('express');
const { Op } = require('sequelize');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { getSlotsDisponibles } = require('../services/disponibilidad');
const { enviarSiCorresponde } = require('../services/notificacionesAutomaticas');
const { generarAgendaPDF } = require('../services/agendaPdf');
const { otorgarPuntosPorGasto } = require('../services/fidelizacion');
const { conPolitica } = require('../services/politicaInasistencia');
const { descontarPorCita, revertirPorCita } = require('../services/consumoTratamiento');
const { otorgarSello, revertirSello } = require('../services/sellos');

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

  // En tratamientos el descuento es en Bs y se pone al crear la cita.
  const precio = Number(servicio.precio);
  const descuento = req.body.descuento === undefined || req.body.descuento === '' || req.body.descuento === null ? 0 : Number(req.body.descuento);
  if (!Number.isFinite(descuento) || descuento < 0) {
    return res.status(400).json({ error: 'El descuento debe ser un monto en Bs' });
  }
  if (descuento > precio) {
    return res.status(400).json({ error: `El descuento no puede ser mayor al precio (Bs ${precio.toFixed(2)})` });
  }

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

  const descuentoBs = Math.round(descuento * 100) / 100;
  const montoTotal = Math.round((precio - descuentoBs) * 100) / 100;
  const monto = Math.round(montoTotal * (porcentaje / 100) * 100) / 100;

  const pago = await db.Pago.create({
    cita_id: cita.id,
    monto,
    monto_total: montoTotal,
    descuento: descuentoBs,
    porcentaje,
    estado: pagada ? 'pagado' : 'pendiente',
  });

  const citaCompleta = await db.Cita.findByPk(cita.id, { include: [db.Paciente, db.Profesional, db.Servicio] });
  res.status(201).json({ cita: citaCompleta, pago });
});

router.get('/staff/citas', requirePermiso('agenda'), async (req, res) => {
  const { fecha, desde, hasta, profesionalId, revision } = req.query;
  const where = {};
  const includePago = { model: db.Pago };

  if (revision === 'sin_revisar') {
    // Bandeja de "comprobantes por revisar": de cualquier fecha.
    where.estado = { [Op.ne]: 'cancelada' };
    includePago.where = { comprobante_revision: 'sin_revisar' };
    includePago.required = true;
  } else if (fecha) {
    where.fecha = fecha;
  } else if (desde && hasta) {
    where.fecha = { [Op.between]: [desde, hasta] };
  }
  if (profesionalId) where.profesional_id = profesionalId;

  const citas = await db.Cita.findAll({
    where,
    include: [db.Paciente, db.Profesional, db.Servicio, includePago],
    order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']],
  });
  res.json(citas.map(conPolitica));
});

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
  const profesional = profesionalId ? await db.Profesional.findByPk(profesionalId, { attributes: ['nombre'] }) : null;
  generarAgendaPDF(res, config, {
    citas,
    desde: fechaDesde,
    hasta: fechaHasta,
    profesional: profesional ? profesional.nombre : null,
    nombreArchivo: esRango ? `agenda-${fechaDesde}_${fechaHasta}.pdf` : `agenda-${fechaDesde}.pdf`,
  });
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

  const estadoAnterior = cita.estado;
  cita.estado = estado;
  await cita.save();

  if (estado === 'completada' && estadoAnterior !== 'completada') {
    const pago = await db.Pago.findOne({ where: { cita_id: cita.id } });
    if (pago) {
      await otorgarPuntosPorGasto({
        pacienteId: cita.paciente_id,
        monto: pago.monto_total,
        motivo: `Cita completada #${cita.id}`,
        citaId: cita.id,
      });
    }

    if (!cita.paquete_sesiones_id) {
      const candidatos = await db.PaqueteSesiones.findAll({
        where: { paciente_id: cita.paciente_id, servicio_id: cita.servicio_id, estado: 'pagado' },
        order: [['fecha_compra', 'ASC'], ['id', 'ASC']],
      });
      const paquete = candidatos.find((p) => p.sesiones_usadas < p.sesiones_totales);
      if (paquete) {
        paquete.sesiones_usadas += 1;
        await paquete.save();
        cita.paquete_sesiones_id = paquete.id;
        await cita.save();
      }
    }
  }

  // Tarjeta de sellos: después de asignar el paquete, para saber si la sesión era un premio.
  let sello = null;
  // Lo que usa el tratamiento sale del inventario al completarse (y vuelve si se deshace).
  let faltantes = [];
  if (estado === 'completada' && estadoAnterior !== 'completada') {
    sello = await otorgarSello(cita, req.usuarioId);
    faltantes = await descontarPorCita(cita, req.usuarioId);
  } else if (estado !== 'completada' && estadoAnterior === 'completada') {
    await revertirSello(cita);
    await revertirPorCita(cita, req.usuarioId);
  }

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

  res.json({ ...cita.toJSON(), sello, faltantes });
});

module.exports = router;

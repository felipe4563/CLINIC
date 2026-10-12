const express = require('express');
const db = require('../models');
const { requirePaciente } = require('./auth.middleware');
const { getSlotsDisponibles } = require('../services/disponibilidad');
const { crearLimiter } = require('../middleware/rateLimiters');
const { recibirArchivo, guardarArchivoPrivado, borrarArchivoPrivado } = require('../services/archivosPrivados');
const { enviarConfirmacionCita } = require('../services/avisosCita');

const router = express.Router();

const PORCENTAJES_VALIDOS = [50, 100];

const crearCitaLimiter = crearLimiter(20, 'Demasiadas reservas seguidas, intenta de nuevo mas tarde');

// Con JSON llega como booleano; con multipart (modo qr_fijo), como texto.
function aceptoPolitica(valor) {
  return valor === true || valor === 'true';
}

router.post('/citas', crearCitaLimiter, requirePaciente, recibirArchivo('comprobante'), async (req, res) => {
  const { profesionalId, servicioId, fecha, horaInicio, porcentajePago, aceptaPolitica } = req.body;
  if (!profesionalId || !servicioId || !fecha || !horaInicio) {
    return res.status(400).json({ error: 'profesionalId, servicioId, fecha y horaInicio son requeridos' });
  }
  const porcentaje = porcentajePago ? Number(porcentajePago) : 100;
  if (!PORCENTAJES_VALIDOS.includes(porcentaje)) {
    return res.status(400).json({ error: 'porcentajePago debe ser 50 o 100' });
  }

  const config = await db.ConfiguracionClinica.obtenerConfig();
  const metodo = config.metodo_pago_online;
  const conPagoOnline = metodo !== 'ninguno';
  if (conPagoOnline && !aceptoPolitica(aceptaPolitica)) {
    return res.status(400).json({ error: 'Debes aceptar la política de inasistencia' });
  }
  if (metodo === 'qr_fijo' && !req.file) {
    return res.status(400).json({ error: 'Sube el comprobante de pago' });
  }

  const slots = await getSlotsDisponibles({
    profesionalId: Number(profesionalId), servicioId: Number(servicioId), fecha,
  });
  const slot = slots.find((s) => s.hora_inicio === horaInicio);
  if (!slot) {
    const error = metodo === 'qr_fijo' ? 'Ese horario acaba de ocuparse, elige otro' : 'El horario ya no esta disponible';
    return res.status(409).json({ error });
  }

  const servicio = await db.Servicio.findByPk(servicioId);
  const montoTotal = Number(servicio.precio);
  const porcentajeFinal = conPagoOnline ? porcentaje : 100;
  const monto = Math.round(montoTotal * (porcentajeFinal / 100) * 100) / 100;

  // El comprobante se escribe recién aquí: ya se validó todo lo demás.
  const archivo = metodo === 'qr_fijo' ? await guardarArchivoPrivado('comprobantes', req.file.buffer) : null;

  let cita;
  let pago;
  try {
    ({ cita, pago } = await db.sequelize.transaction(async (transaction) => {
      const nuevaCita = await db.Cita.create({
        paciente_id: req.pacienteId,
        profesional_id: Number(profesionalId),
        servicio_id: Number(servicioId),
        fecha,
        hora_inicio: `${slot.hora_inicio}:00`,
        hora_fin: `${slot.hora_fin}:00`,
        estado: metodo === 'qr_banco' ? 'pendiente_pago' : 'confirmada',
        politica_aceptada_en: conPagoOnline ? new Date() : null,
      }, { transaction });

      const nuevoPago = await db.Pago.create({
        cita_id: nuevaCita.id,
        monto,
        monto_total: montoTotal,
        porcentaje: porcentajeFinal,
        estado: metodo === 'qr_fijo' ? 'pagado' : 'pendiente',
        metodo_adelanto: conPagoOnline ? metodo : null,
        comprobante_archivo: archivo,
        comprobante_revision: metodo === 'qr_fijo' ? 'sin_revisar' : null,
      }, { transaction });

      return { cita: nuevaCita, pago: nuevoPago };
    }));
  } catch (err) {
    await borrarArchivoPrivado('comprobantes', archivo);
    throw err;
  }

  let avisoWhatsApp;
  if (metodo === 'qr_fijo') {
    const paciente = await db.Paciente.findByPk(req.pacienteId);
    avisoWhatsApp = await enviarConfirmacionCita(paciente.telefono, fecha, slot.hora_inicio);
  }

  const pagoJSON = pago.toJSON();
  delete pagoJSON.comprobante_archivo;
  res.status(201).json({ cita, pago: pagoJSON, requierePago: metodo === 'qr_banco', avisoWhatsApp });
});

router.get('/citas/mias', requirePaciente, async (req, res) => {
  const citas = await db.Cita.findAll({
    where: { paciente_id: req.pacienteId },
    attributes: { exclude: ['justificacion_archivo', 'justificacion_nota'] },
    include: [
      db.Profesional,
      db.Servicio,
      { model: db.Pago, attributes: { exclude: ['comprobante_archivo', 'comprobante_revisado_por_id'] } },
    ],
    order: [['fecha', 'DESC'], ['hora_inicio', 'DESC']],
  });
  res.json(citas);
});

module.exports = router;

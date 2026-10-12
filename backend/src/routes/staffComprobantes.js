// backend/src/routes/staffComprobantes.js
// Revisión de los comprobantes del modo "QR fijo + comprobante".
const express = require('express');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { enviarArchivoPrivado } = require('../services/archivosPrivados');
const { enviarAvisoCita } = require('../services/avisosCita');
const { conPolitica } = require('../services/politicaInasistencia');

const router = express.Router();
const onlyAgenda = requirePermiso('agenda');

const MENSAJE_ANULACION = 'tu reserva fue anulada porque no pudimos validar el comprobante de pago. Si crees que es un error, escríbenos por este medio.';

async function citaCompleta(id) {
  return db.Cita.findByPk(id, { include: [db.Paciente, db.Profesional, db.Servicio, db.Pago] });
}

router.get('/staff/pagos/:id/comprobante', onlyAgenda, async (req, res) => {
  const pago = await db.Pago.findByPk(req.params.id);
  if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
  return enviarArchivoPrivado(res, 'comprobantes', pago.comprobante_archivo);
});

router.patch('/staff/pagos/:id/revision', onlyAgenda, async (req, res) => {
  const { resultado } = req.body;
  if (!['valido', 'invalido'].includes(resultado)) {
    return res.status(400).json({ error: 'resultado debe ser valido o invalido' });
  }

  const pago = await db.Pago.findByPk(req.params.id, { include: [{ model: db.Cita, as: 'Cita', include: [db.Paciente] }] });
  if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
  if (pago.metodo_adelanto !== 'qr_fijo') {
    return res.status(400).json({ error: 'Este pago no tiene comprobante para revisar' });
  }
  if (pago.comprobante_revision === 'invalido') {
    return res.status(400).json({ error: 'Este comprobante ya se marcó como inválido y la cita fue anulada' });
  }

  const cita = pago.Cita;
  if (resultado === 'invalido' && ['completada', 'no_asistio'].includes(cita.estado)) {
    return res.status(400).json({ error: 'No se puede anular una cita que ya se atendió o se marcó como inasistencia' });
  }

  await db.sequelize.transaction(async (transaction) => {
    pago.comprobante_revision = resultado;
    pago.comprobante_revisado_por_id = req.usuarioId;
    pago.comprobante_revisado_en = new Date();
    if (resultado === 'invalido') {
      pago.estado = 'fallido';
      cita.estado = 'cancelada';
      await cita.save({ transaction });
    }
    await pago.save({ transaction });
  });

  let avisoWhatsApp;
  if (resultado === 'invalido') {
    avisoWhatsApp = await enviarAvisoCita({
      telefono: cita.Paciente.telefono,
      nombre: cita.Paciente.nombre_completo,
      fecha: cita.fecha,
      hora: String(cita.hora_inicio).slice(0, 5),
      mensaje: MENSAJE_ANULACION,
    });
  }

  res.json({ cita: conPolitica(await citaCompleta(cita.id)), avisoWhatsApp });
});

module.exports = router;

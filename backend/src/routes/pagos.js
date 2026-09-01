const express = require('express');
const db = require('../models');
const { requirePaciente } = require('./auth.middleware');
const { generarQR, consultarEstadoQR } = require('../services/bancoEconomico');
const { enviarPlantillaWhatsApp } = require('../services/whatsapp');

const router = express.Router();

router.post('/pagos/:citaId/qr', requirePaciente, async (req, res) => {
  const cita = await db.Cita.findOne({
    where: { id: req.params.citaId, paciente_id: req.pacienteId },
    include: [db.Pago, db.Servicio],
  });
  if (!cita || !cita.Pago) return res.status(404).json({ error: 'Cita o pago no encontrado' });

  const { qrId, qrImageBase64 } = await generarQR({
    monto: cita.Pago.monto,
    transactionId: `CITA-${cita.id}-${Date.now()}`,
    descripcion: `Cita ${cita.id} - ${cita.Servicio.nombre}`,
  });

  cita.Pago.referencia_qr_banco = qrId;
  await cita.Pago.save();

  res.json({ qrImageBase64, referencia: qrId });
});

// El banco llama a este endpoint cuando se paga un QR, pero su documentacion
// no define firma ni secreto compartido para esta notificacion. Por eso no
// confiamos en el contenido del body: lo usamos solo como aviso de "revisa
// este qrId", y confirmamos el pago consultando nosotros mismos statusQR con
// nuestro propio token autenticado antes de mutar cualquier estado.
router.post('/pagos/webhook', async (req, res) => {
  const qrId = req.body && req.body.payment && req.body.payment.qrId;
  if (!qrId) return res.json({ responseCode: 1, message: 'qrId no encontrado en el payload' });

  const pago = await db.Pago.findOne({
    where: { referencia_qr_banco: qrId },
    include: [{ model: db.Cita, as: 'Cita' }],
  });
  if (!pago) return res.json({ responseCode: 0, message: '' });

  if (pago.estado === 'pagado') {
    return res.json({ responseCode: 0, message: '' });
  }

  const { pagado } = await consultarEstadoQR(qrId);

  if (pagado) {
    pago.estado = 'pagado';
    await pago.save();
    pago.Cita.estado = 'confirmada';
    await pago.Cita.save();

    const paciente = await db.Paciente.findByPk(pago.Cita.paciente_id);
    await enviarPlantillaWhatsApp(paciente.telefono, 'cita_confirmada', [pago.Cita.fecha, pago.Cita.hora_inicio]);
  }

  res.json({ responseCode: 0, message: '' });
});

module.exports = router;

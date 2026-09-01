const express = require('express');
const db = require('../models');
const { requirePaciente } = require('./auth.middleware');
const { generarQR, validarWebhook } = require('../services/bancoEconomico');
const { enviarPlantillaWhatsApp } = require('../services/whatsapp');

const router = express.Router();

router.post('/pagos/:citaId/qr', requirePaciente, async (req, res) => {
  const cita = await db.Cita.findOne({
    where: { id: req.params.citaId, paciente_id: req.pacienteId },
    include: [db.Pago],
  });
  if (!cita || !cita.Pago) return res.status(404).json({ error: 'Cita o pago no encontrado' });

  const { qrImageBase64, referencia } = await generarQR({
    monto: cita.Pago.monto,
    referencia: `CITA-${cita.id}`,
  });

  cita.Pago.referencia_qr_banco = referencia;
  await cita.Pago.save();

  res.json({ qrImageBase64, referencia });
});

router.post('/pagos/webhook', async (req, res) => {
  const secretEsperado = process.env.BANCO_ECONOMICO_WEBHOOK_SECRET;
  const secretRecibido = req.header('X-Webhook-Secret');
  if (!secretEsperado || secretRecibido !== secretEsperado) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (!validarWebhook(req.body)) return res.status(400).json({ error: 'Payload invalido' });

  const { referencia, estado } = req.body;
  const pago = await db.Pago.findOne({
    where: { referencia_qr_banco: referencia },
    include: [{ model: db.Cita, as: 'Cita' }],
  });
  if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });

  if (pago.estado === 'pagado') {
    return res.json({ ok: true });
  }

  if (estado === 'pagado') {
    pago.estado = 'pagado';
    await pago.save();
    pago.Cita.estado = 'confirmada';
    await pago.Cita.save();

    const paciente = await db.Paciente.findByPk(pago.Cita.paciente_id);
    await enviarPlantillaWhatsApp(paciente.telefono, 'cita_confirmada', [pago.Cita.fecha, pago.Cita.hora_inicio]);
  } else {
    pago.estado = 'fallido';
    await pago.save();
  }

  res.json({ ok: true });
});

module.exports = router;

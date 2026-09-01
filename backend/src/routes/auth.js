const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../models');
const { enviarPlantillaWhatsApp } = require('../services/whatsapp');

const router = express.Router();

const MAX_INTENTOS = 5;

const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intenta de nuevo mas tarde' },
});

function generarCodigo() {
  return String(crypto.randomInt(100000, 1000000));
}

function generarCodigoPaciente(id) {
  return `PAC-${String(id).padStart(6, '0')}`;
}

router.post('/otp/request', otpRequestLimiter, async (req, res) => {
  const { telefono, nombre_completo, carnet_identidad, carnet_complemento, carnet_expedido } = req.body;
  if (!telefono) return res.status(400).json({ error: 'telefono es requerido' });

  let paciente = await db.Paciente.findOne({ where: { telefono } });
  if (!paciente) {
    paciente = await db.Paciente.create({
      codigo_paciente: `PAC-TMP-${Date.now()}`,
      nombre_completo: nombre_completo || 'Sin nombre',
      telefono,
      carnet_identidad: carnet_identidad || 'pendiente',
      carnet_complemento: carnet_complemento || null,
      carnet_expedido: carnet_expedido || 'pendiente',
    });
    paciente.codigo_paciente = generarCodigoPaciente(paciente.id);
    await paciente.save();
  }

  const codigo = generarCodigo();
  await db.OtpCode.create({
    telefono,
    codigo,
    expira_en: new Date(Date.now() + 5 * 60 * 1000),
    usado: false,
  });

  await enviarPlantillaWhatsApp(telefono, process.env.WHATSAPP_OTP_TEMPLATE, [codigo]);

  res.json({ ok: true });
});

router.post('/otp/verify', async (req, res) => {
  const { telefono, codigo } = req.body;
  const otp = await db.OtpCode.findOne({
    where: { telefono, usado: false },
    order: [['id', 'DESC']],
  });

  if (!otp || otp.expira_en < new Date() || otp.intentos >= MAX_INTENTOS) {
    return res.status(401).json({ error: 'Codigo invalido o expirado' });
  }

  if (otp.codigo !== codigo) {
    otp.intentos += 1;
    await otp.save();
    return res.status(401).json({ error: 'Codigo invalido o expirado' });
  }

  otp.usado = true;
  await otp.save();

  const paciente = await db.Paciente.findOne({ where: { telefono } });
  const token = jwt.sign({ pacienteId: paciente.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

  res.json({ token });
});

module.exports = router;

const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../models');
const { enviarPlantillaWhatsApp } = require('../services/whatsapp');
const { generarCodigoCliente } = require('../services/codigoCliente');

const router = express.Router();

const MAX_INTENTOS = 5;

const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intenta de nuevo mas tarde' },
});

const codigoLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos, intenta de nuevo mas tarde' },
});

const registroLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intenta de nuevo mas tarde' },
});

function generarCodigo() {
  return String(crypto.randomInt(100000, 1000000));
}

router.post('/otp/request', otpRequestLimiter, async (req, res) => {
  const { telefono, nombre_completo, carnet_identidad, carnet_complemento, carnet_expedido } = req.body;
  if (!telefono) return res.status(400).json({ error: 'telefono es requerido' });

  let paciente = await db.Paciente.findOne({ where: { telefono } });
  if (!paciente) {
    paciente = await db.Paciente.create({
      codigo_paciente: await generarCodigoCliente(db),
      nombre_completo: nombre_completo || 'Sin nombre',
      telefono,
      carnet_identidad: carnet_identidad || 'pendiente',
      carnet_complemento: carnet_complemento || null,
      carnet_expedido: carnet_expedido || 'pendiente',
    });
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

// Registro directo para la reserva publica: crea (o reconoce) al paciente por
// telefono y entrega el token de una vez, sin paso de verificacion por
// WhatsApp. A diferencia de /otp/*, no prueba que quien reserva es dueno de
// ese telefono -- decision de producto para agilizar la reserva en el sitio
// publico. El pago siempre se hace en la app bancaria de quien reserva.
router.post('/registro', registroLimiter, async (req, res) => {
  const { telefono, nombre_completo, carnet_identidad, carnet_complemento, carnet_expedido } = req.body;
  if (!telefono || !nombre_completo || !carnet_identidad || !carnet_expedido) {
    return res.status(400).json({ error: 'telefono, nombre_completo, carnet_identidad y carnet_expedido son requeridos' });
  }

  let paciente = await db.Paciente.findOne({ where: { telefono } });
  if (!paciente) {
    paciente = await db.Paciente.create({
      codigo_paciente: await generarCodigoCliente(db),
      nombre_completo,
      telefono,
      carnet_identidad,
      carnet_complemento: carnet_complemento || null,
      carnet_expedido,
    });
  }

  const token = jwt.sign({ pacienteId: paciente.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, codigo_paciente: paciente.codigo_paciente });
});

router.post('/codigo/login', codigoLoginLimiter, async (req, res) => {
  const { codigo_paciente, telefono } = req.body;
  if (!codigo_paciente || !telefono) {
    return res.status(400).json({ error: 'codigo_paciente y telefono son requeridos' });
  }

  const paciente = await db.Paciente.findOne({ where: { codigo_paciente, telefono } });
  if (!paciente) {
    return res.status(401).json({ error: 'Codigo o telefono incorrectos' });
  }

  const token = jwt.sign({ pacienteId: paciente.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token });
});

module.exports = router;

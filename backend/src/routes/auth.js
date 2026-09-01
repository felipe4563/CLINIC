const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../models');
const { enviarPlantillaWhatsApp } = require('../services/whatsapp');

const router = express.Router();

function generarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generarCodigoPaciente(id) {
  return `PAC-${String(id).padStart(6, '0')}`;
}

router.post('/otp/request', async (req, res) => {
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
    where: { telefono, codigo, usado: false },
    order: [['id', 'DESC']],
  });

  if (!otp || otp.expira_en < new Date()) {
    return res.status(401).json({ error: 'Codigo invalido o expirado' });
  }

  otp.usado = true;
  await otp.save();

  const paciente = await db.Paciente.findOne({ where: { telefono } });
  const token = jwt.sign({ pacienteId: paciente.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

  res.json({ token });
});

module.exports = router;

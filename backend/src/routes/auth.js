const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { Op } = require('sequelize');
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

// Solo cuentan los intentos fallidos: quien entra bien no se bloquea, y quien prueba
// carnets ajenos se frena a los 10 errores.
const ciLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos, intenta de nuevo mas tarde' },
});

// La web guarda el teléfono como dígitos con código de país; se comparan así.
function soloDigitos(v) {
  return String(v || '').replace(/\D/g, '');
}

function texto(v, max) {
  const t = typeof v === 'string' ? v.trim() : '';
  return t ? t.slice(0, max) : null;
}

function firmarPaciente(paciente) {
  return jwt.sign({ pacienteId: paciente.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

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

  await enviarPlantillaWhatsApp(telefono, process.env.WHATSAPP_OTP_TEMPLATE, [codigo], { boton: codigo });

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
  const sexo = ['F', 'M'].includes(req.body.sexo) ? req.body.sexo : null;
  const fechaNacimiento = /^\d{4}-\d{2}-\d{2}$/.test(req.body.fecha_nacimiento || '') ? req.body.fecha_nacimiento : null;
  const edadNum = Number(req.body.edad);
  const edad = req.body.edad !== undefined && req.body.edad !== '' && Number.isInteger(edadNum) && edadNum >= 0 && edadNum <= 120 ? edadNum : null;

  let paciente = await db.Paciente.findOne({ where: { telefono } });
  if (paciente) {
    // Un teléfono ya registrado solo entra si el carnet coincide: así nadie
    // reserva a nombre de otra persona escribiendo su número.
    if (soloDigitos(paciente.carnet_identidad) !== soloDigitos(carnet_identidad)) {
      return res.status(409).json({ error: 'Ese teléfono ya tiene una ficha. Elige "Ya vine antes" e ingresa tu CI y teléfono.' });
    }
  } else {
    paciente = await db.Paciente.create({
      codigo_paciente: await generarCodigoCliente(db),
      nombre_completo: String(nombre_completo).trim(),
      telefono,
      carnet_identidad: String(carnet_identidad).trim(),
      carnet_complemento: carnet_complemento || null,
      carnet_expedido,
      sexo,
      fecha_nacimiento: fechaNacimiento,
      edad,
      edad_fecha: edad !== null ? new Date().toISOString().slice(0, 10) : null,
      email: texto(req.body.email, 160),
      direccion: texto(req.body.direccion, 255),
      como_nos_conocio: texto(req.body.como_nos_conocio, 60),
    });
  }

  res.json({ token: firmarPaciente(paciente), codigo_paciente: paciente.codigo_paciente, nombre: paciente.nombre_completo });
});

// "Ya vine antes": CI + teléfono registrado. Hacen falta los dos para no
// revelar a quién pertenece un carnet.
router.post('/ci/login', ciLoginLimiter, async (req, res) => {
  const carnet = soloDigitos(req.body.carnet_identidad);
  const telefono = soloDigitos(req.body.telefono);
  if (!carnet || !telefono) {
    return res.status(400).json({ error: 'Ingresa tu CI y tu teléfono' });
  }

  const candidatos = await db.Paciente.findAll({ where: { carnet_identidad: { [Op.like]: `%${carnet}%` } } });
  // El teléfono puede estar guardado con o sin código de país.
  const paciente = candidatos.find((p) => {
    const tel = soloDigitos(p.telefono);
    return soloDigitos(p.carnet_identidad) === carnet && (tel === telefono || tel.endsWith(telefono) || telefono.endsWith(tel));
  });
  if (!paciente) {
    return res.status(401).json({ error: 'No encontramos una ficha con ese CI y teléfono. Revisa los datos o elige "Es mi primera vez".' });
  }

  res.json({ token: firmarPaciente(paciente), nombre: paciente.nombre_completo });
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

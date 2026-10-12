const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { TEXTO_POR_DEFECTO } = require('../services/politicaInasistencia');

const router = express.Router();
const onlyConfiguracion = requirePermiso('configuracion');

const CAMPOS_CONFIG = [
  'nombre_consultorio',
  'nit',
  'direccion',
  'ciudad',
  'pais',
  'telefono',
  'email',
  'sitio_web',
  'pie_pdf',
  'qr_fijo_datos',
  'politica_inasistencia',
];

const LOGO_DIR = path.join(__dirname, '..', '..', 'uploads', 'logo');
fs.mkdirSync(LOGO_DIR, { recursive: true });

const EXT_POR_MIME = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, LOGO_DIR),
    filename: (req, file, cb) => cb(null, `logo-${Date.now()}${EXT_POR_MIME[file.mimetype]}`),
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!EXT_POR_MIME[file.mimetype]) return cb(new Error('Formato no soportado. Usa PNG, JPG, WEBP o SVG.'));
    cb(null, true);
  },
});

function borrarArchivoLogo(logoUrl) {
  if (!logoUrl || !logoUrl.startsWith('/uploads/logo/')) return;
  const archivo = path.join(LOGO_DIR, path.basename(logoUrl));
  fs.unlink(archivo, () => {});
}

const METODOS_PAGO = ['ninguno', 'qr_banco', 'qr_fijo'];

// El QR fijo sí es público: el paciente tiene que verlo para pagar.
const QR_DIR = path.join(__dirname, '..', '..', 'uploads', 'qr');
fs.mkdirSync(QR_DIR, { recursive: true });
const EXT_QR = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };

const uploadQr = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, QR_DIR),
    filename: (req, file, cb) => cb(null, `qr-${Date.now()}${EXT_QR[file.mimetype]}`),
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!EXT_QR[file.mimetype]) return cb(new Error('Formato no soportado. Usa PNG, JPG o WEBP.'));
    cb(null, true);
  },
});

function borrarArchivoQr(qrUrl) {
  if (!qrUrl || !qrUrl.startsWith('/uploads/qr/')) return;
  fs.unlink(path.join(QR_DIR, path.basename(qrUrl)), () => {});
}

function respuestaConfig(config) {
  return { ...config.toJSON(), politica_inasistencia_por_defecto: TEXTO_POR_DEFECTO };
}

router.get('/staff/configuracion', onlyConfiguracion, async (req, res) => {
  const config = await db.ConfiguracionClinica.obtenerConfig();
  res.json(respuestaConfig(config));
});

router.put('/staff/configuracion', onlyConfiguracion, async (req, res) => {
  const config = await db.ConfiguracionClinica.obtenerConfig();
  for (const campo of CAMPOS_CONFIG) {
    if (typeof req.body[campo] === 'string' || req.body[campo] === null) {
      config[campo] = req.body[campo];
    }
  }
  if (req.body.metodo_pago_online !== undefined) {
    if (!METODOS_PAGO.includes(req.body.metodo_pago_online)) {
      return res.status(400).json({ error: 'metodo_pago_online debe ser ninguno, qr_banco o qr_fijo' });
    }
    if (req.body.metodo_pago_online === 'qr_fijo' && !config.qr_fijo_url) {
      return res.status(400).json({ error: 'Sube primero la imagen del QR' });
    }
    config.metodo_pago_online = req.body.metodo_pago_online;
  }
  if (req.body.bs_por_punto !== undefined) {
    const bsPorPunto = Number(req.body.bs_por_punto);
    if (!bsPorPunto || bsPorPunto <= 0) {
      return res.status(400).json({ error: 'bs_por_punto debe ser un numero mayor a cero' });
    }
    config.bs_por_punto = bsPorPunto;
  }
  if (req.body.asistencia_lat !== undefined || req.body.asistencia_lng !== undefined) {
    const lat = req.body.asistencia_lat === null ? null : Number(req.body.asistencia_lat);
    const lng = req.body.asistencia_lng === null ? null : Number(req.body.asistencia_lng);
    if ((lat !== null && (Number.isNaN(lat) || lat < -90 || lat > 90)) || (lng !== null && (Number.isNaN(lng) || lng < -180 || lng > 180))) {
      return res.status(400).json({ error: 'Coordenadas inválidas' });
    }
    config.asistencia_lat = lat;
    config.asistencia_lng = lng;
  }
  if (req.body.asistencia_radio_metros !== undefined) {
    const radio = Number(req.body.asistencia_radio_metros);
    if (!radio || radio <= 0) {
      return res.status(400).json({ error: 'asistencia_radio_metros debe ser un numero mayor a cero' });
    }
    config.asistencia_radio_metros = radio;
  }
  await config.save();
  res.json(respuestaConfig(config));
});

router.post('/staff/configuracion/logo', onlyConfiguracion, (req, res) => {
  upload.single('logo')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    const config = await db.ConfiguracionClinica.obtenerConfig();
    borrarArchivoLogo(config.logo_url);
    config.logo_url = `/uploads/logo/${req.file.filename}`;
    await config.save();
    res.json(respuestaConfig(config));
  });
});

router.delete('/staff/configuracion/logo', onlyConfiguracion, async (req, res) => {
  const config = await db.ConfiguracionClinica.obtenerConfig();
  borrarArchivoLogo(config.logo_url);
  config.logo_url = null;
  await config.save();
  res.json(respuestaConfig(config));
});

router.post('/staff/configuracion/qr', onlyConfiguracion, (req, res) => {
  uploadQr.single('qr')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    const config = await db.ConfiguracionClinica.obtenerConfig();
    borrarArchivoQr(config.qr_fijo_url);
    config.qr_fijo_url = `/uploads/qr/${req.file.filename}`;
    await config.save();
    res.json(respuestaConfig(config));
  });
});

router.delete('/staff/configuracion/qr', onlyConfiguracion, async (req, res) => {
  const config = await db.ConfiguracionClinica.obtenerConfig();
  if (config.metodo_pago_online === 'qr_fijo') {
    return res.status(400).json({ error: 'Cambia primero el modo de pago: el modo "QR fijo + comprobante" necesita la imagen del QR' });
  }
  borrarArchivoQr(config.qr_fijo_url);
  config.qr_fijo_url = null;
  await config.save();
  res.json(respuestaConfig(config));
});

module.exports = router;

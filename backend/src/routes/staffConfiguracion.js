const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');

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

router.get('/staff/configuracion', onlyConfiguracion, async (req, res) => {
  const config = await db.ConfiguracionClinica.obtenerConfig();
  res.json(config);
});

router.put('/staff/configuracion', onlyConfiguracion, async (req, res) => {
  const config = await db.ConfiguracionClinica.obtenerConfig();
  for (const campo of CAMPOS_CONFIG) {
    if (typeof req.body[campo] === 'string' || req.body[campo] === null) {
      config[campo] = req.body[campo];
    }
  }
  await config.save();
  res.json(config);
});

router.post('/staff/configuracion/logo', onlyConfiguracion, (req, res) => {
  upload.single('logo')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    const config = await db.ConfiguracionClinica.obtenerConfig();
    borrarArchivoLogo(config.logo_url);
    config.logo_url = `/uploads/logo/${req.file.filename}`;
    await config.save();
    res.json(config);
  });
});

router.delete('/staff/configuracion/logo', onlyConfiguracion, async (req, res) => {
  const config = await db.ConfiguracionClinica.obtenerConfig();
  borrarArchivoLogo(config.logo_url);
  config.logo_url = null;
  await config.save();
  res.json(config);
});

module.exports = router;

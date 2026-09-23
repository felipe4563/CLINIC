const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const db = require('../models');
const { requireStaff } = require('./auth.middleware');

const router = express.Router();
const anyStaff = requireStaff();

const AVATARES_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatares');
fs.mkdirSync(AVATARES_DIR, { recursive: true });

const EXT_POR_MIME = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

const uploadAvatar = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, AVATARES_DIR),
    filename: (req, file, cb) => cb(null, `avatar-${req.usuarioId}-${Date.now()}${EXT_POR_MIME[file.mimetype]}`),
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!EXT_POR_MIME[file.mimetype]) return cb(new Error('Formato no soportado. Usa PNG, JPG o WEBP.'));
    cb(null, true);
  },
});

function borrarAvatar(avatarUrl) {
  if (!avatarUrl || !avatarUrl.startsWith('/uploads/avatares/')) return;
  const archivo = path.join(AVATARES_DIR, path.basename(avatarUrl));
  fs.unlink(archivo, () => {});
}

router.post('/staff/perfil/avatar', anyStaff, async (req, res) => {
  const usuario = await db.Usuario.findByPk(req.usuarioId);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

  uploadAvatar.single('avatar')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    borrarAvatar(usuario.avatar_url);
    usuario.avatar_url = `/uploads/avatares/${req.file.filename}`;
    await usuario.save();
    res.json({ avatar_url: usuario.avatar_url });
  });
});

router.delete('/staff/perfil/avatar', anyStaff, async (req, res) => {
  const usuario = await db.Usuario.findByPk(req.usuarioId);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

  borrarAvatar(usuario.avatar_url);
  usuario.avatar_url = null;
  await usuario.save();
  res.json({ avatar_url: null });
});

router.post('/staff/perfil/password', anyStaff, async (req, res) => {
  const { passwordActual, passwordNueva } = req.body;
  if (!passwordActual || !passwordNueva) {
    return res.status(400).json({ error: 'passwordActual y passwordNueva son requeridos' });
  }
  if (passwordNueva.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
  }

  const usuario = await db.Usuario.findByPk(req.usuarioId);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

  const passwordValida = await bcrypt.compare(passwordActual, usuario.password_hash);
  if (!passwordValida) {
    return res.status(400).json({ error: 'La contraseña actual no es correcta' });
  }

  usuario.password_hash = await bcrypt.hash(passwordNueva, 10);
  await usuario.save();
  res.status(204).end();
});

module.exports = router;

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../models');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: 'Demasiados intentos, intenta de nuevo mas tarde' },
});

router.post('/staff/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email y password son requeridos' });
  }

  const usuario = await db.Usuario.findOne({ where: { email }, include: [db.Rol] });
  if (!usuario || !usuario.activo) {
    return res.status(401).json({ error: 'Credenciales invalidas' });
  }

  const passwordValida = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValida) {
    return res.status(401).json({ error: 'Credenciales invalidas' });
  }

  const permisos = usuario.Rol.permisos || [];

  const token = jwt.sign(
    { usuarioId: usuario.id, rolId: usuario.Rol.id, rolNombre: usuario.Rol.nombre, permisos },
    process.env.JWT_STAFF_SECRET,
    { expiresIn: '8h' },
  );

  res.json({
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.Rol.nombre,
      permisos,
    },
  });
});

module.exports = router;

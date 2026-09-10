const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { MODULOS, CLAVES_VALIDAS } = require('../config/permisos');

const router = express.Router();

const onlyUsuarios = requirePermiso('usuarios');

async function contarUsuariosConPermiso(permiso, { excluirRolId, excluirUsuarioId } = {}) {
  const roles = await db.Rol.findAll({ where: excluirRolId ? { id: { [Op.ne]: excluirRolId } } : {} });
  const rolIds = roles.filter((r) => (r.permisos || []).includes(permiso)).map((r) => r.id);
  if (rolIds.length === 0) return 0;
  return db.Usuario.count({
    where: {
      rol_id: { [Op.in]: rolIds },
      activo: true,
      ...(excluirUsuarioId ? { id: { [Op.ne]: excluirUsuarioId } } : {}),
    },
  });
}

function limpiarPermisos(permisos) {
  return Array.isArray(permisos) ? permisos.filter((p) => CLAVES_VALIDAS.includes(p)) : [];
}

// ---- Usuarios ----

router.get('/staff/usuarios', onlyUsuarios, async (req, res) => {
  const usuarios = await db.Usuario.findAll({
    include: [db.Rol],
    attributes: { exclude: ['password_hash'] },
    order: [['nombre', 'ASC']],
  });
  res.json(usuarios);
});

router.post('/staff/usuarios', onlyUsuarios, async (req, res) => {
  const { nombre, email, password, rolNombre } = req.body;
  if (!nombre || !email || !password || !rolNombre) {
    return res.status(400).json({ error: 'nombre, email, password y rolNombre son requeridos' });
  }

  const rol = await db.Rol.findOne({ where: { nombre: rolNombre } });
  if (!rol) return res.status(400).json({ error: 'rolNombre invalido' });

  const existente = await db.Usuario.findOne({ where: { email } });
  if (existente) return res.status(409).json({ error: 'Ya existe un usuario con ese email' });

  const password_hash = await bcrypt.hash(password, 10);
  const usuario = await db.Usuario.create({ nombre, email, password_hash, rol_id: rol.id });

  res.status(201).json({ id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: rol.nombre });
});

router.patch('/staff/usuarios/:id', onlyUsuarios, async (req, res) => {
  const usuario = await db.Usuario.findByPk(req.params.id, { include: [db.Rol] });
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

  const esUnoMismo = Number(req.params.id) === req.usuarioId;
  const { nombre, email, activo, rolNombre, password } = req.body;

  let nuevoRol = usuario.Rol;
  if (rolNombre !== undefined) {
    nuevoRol = await db.Rol.findOne({ where: { nombre: rolNombre } });
    if (!nuevoRol) return res.status(400).json({ error: 'rolNombre invalido' });
  }
  const nuevoActivo = activo !== undefined ? activo : usuario.activo;
  const teniaPermisoUsuarios = (usuario.Rol.permisos || []).includes('usuarios');
  const tendraPermisoUsuarios = (nuevoRol.permisos || []).includes('usuarios') && nuevoActivo;

  if (esUnoMismo && teniaPermisoUsuarios && !tendraPermisoUsuarios) {
    return res.status(400).json({ error: 'No puedes quitarte a ti mismo el permiso de usuarios' });
  }

  if (teniaPermisoUsuarios && !tendraPermisoUsuarios) {
    const quedanOtros = await contarUsuariosConPermiso('usuarios', { excluirUsuarioId: usuario.id });
    if (quedanOtros === 0) {
      return res.status(400).json({ error: 'Debe quedar al menos un usuario activo con permiso de usuarios' });
    }
  }

  if (nombre !== undefined) usuario.nombre = nombre;
  if (email !== undefined) usuario.email = email;
  if (activo !== undefined) usuario.activo = activo;
  if (password) usuario.password_hash = await bcrypt.hash(password, 10);
  if (rolNombre !== undefined) usuario.rol_id = nuevoRol.id;

  await usuario.save();
  res.json({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    activo: usuario.activo,
    Rol: { nombre: nuevoRol.nombre, permisos: nuevoRol.permisos },
  });
});

router.delete('/staff/usuarios/:id', onlyUsuarios, async (req, res) => {
  const usuario = await db.Usuario.findByPk(req.params.id, { include: [db.Rol] });
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

  if (Number(req.params.id) === req.usuarioId) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
  }

  if ((usuario.Rol.permisos || []).includes('usuarios')) {
    const quedanOtros = await contarUsuariosConPermiso('usuarios', { excluirUsuarioId: usuario.id });
    if (quedanOtros === 0) {
      return res.status(400).json({ error: 'Debe quedar al menos un usuario activo con permiso de usuarios' });
    }
  }

  await usuario.destroy();
  res.status(204).end();
});

// ---- Roles y permisos ----

router.get('/staff/permisos-disponibles', onlyUsuarios, async (req, res) => {
  res.json(MODULOS);
});

router.get('/staff/roles', onlyUsuarios, async (req, res) => {
  const roles = await db.Rol.findAll({ order: [['nombre', 'ASC']] });
  const conteos = await db.Usuario.findAll({
    attributes: ['rol_id', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total']],
    group: ['rol_id'],
    raw: true,
  });
  const totalPorRol = Object.fromEntries(conteos.map((c) => [c.rol_id, Number(c.total)]));
  res.json(roles.map((r) => ({ id: r.id, nombre: r.nombre, permisos: r.permisos, usuarios: totalPorRol[r.id] || 0 })));
});

router.post('/staff/roles', onlyUsuarios, async (req, res) => {
  const { nombre, permisos } = req.body;
  if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'nombre es requerido' });

  const existente = await db.Rol.findOne({ where: { nombre: nombre.trim() } });
  if (existente) return res.status(409).json({ error: 'Ya existe un rol con ese nombre' });

  const rol = await db.Rol.create({ nombre: nombre.trim(), permisos: limpiarPermisos(permisos) });
  res.status(201).json(rol);
});

router.patch('/staff/roles/:id', onlyUsuarios, async (req, res) => {
  const rol = await db.Rol.findByPk(req.params.id);
  if (!rol) return res.status(404).json({ error: 'Rol no encontrado' });

  const { nombre, permisos } = req.body;

  if (nombre !== undefined && nombre.trim() && nombre.trim() !== rol.nombre) {
    const existente = await db.Rol.findOne({ where: { nombre: nombre.trim() } });
    if (existente) return res.status(409).json({ error: 'Ya existe un rol con ese nombre' });
    rol.nombre = nombre.trim();
  }

  if (permisos !== undefined) {
    const permisosLimpios = limpiarPermisos(permisos);
    const perderiaUsuarios = (rol.permisos || []).includes('usuarios') && !permisosLimpios.includes('usuarios');
    if (perderiaUsuarios) {
      const otrosConPermiso = await contarUsuariosConPermiso('usuarios', { excluirRolId: rol.id });
      if (otrosConPermiso === 0) {
        return res.status(400).json({ error: 'Debe quedar al menos un rol con permiso de usuarios y usuarios activos en él' });
      }
    }
    rol.permisos = permisosLimpios;
  }

  await rol.save();
  res.json(rol);
});

router.delete('/staff/roles/:id', onlyUsuarios, async (req, res) => {
  const rol = await db.Rol.findByPk(req.params.id);
  if (!rol) return res.status(404).json({ error: 'Rol no encontrado' });

  const usuariosConRol = await db.Usuario.count({ where: { rol_id: rol.id } });
  if (usuariosConRol > 0) {
    return res.status(409).json({ error: 'No se puede eliminar: hay usuarios con este rol asignado' });
  }

  await rol.destroy();
  res.status(204).end();
});

module.exports = router;

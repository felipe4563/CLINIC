require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../models');
const { PERMISOS_POR_DEFECTO } = require('../config/permisos');

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const nombre = process.env.SEED_ADMIN_NOMBRE || 'Administrador';

  if (!email || !password) {
    console.error('SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD son requeridos');
    process.exit(1);
  }

  await db.sequelize.sync();

  const [rolAdmin] = await db.Rol.findOrCreate({
    where: { nombre: 'Admin' },
    defaults: { permisos: PERMISOS_POR_DEFECTO.Admin },
  });
  await db.Rol.findOrCreate({ where: { nombre: 'Recepcion' }, defaults: { permisos: PERMISOS_POR_DEFECTO.Recepcion } });
  await db.Rol.findOrCreate({ where: { nombre: 'Profesional' }, defaults: { permisos: PERMISOS_POR_DEFECTO.Profesional } });

  const password_hash = await bcrypt.hash(password, 10);
  const [usuario, creado] = await db.Usuario.findOrCreate({
    where: { email },
    defaults: { nombre, password_hash, rol_id: rolAdmin.id },
  });

  if (!creado) {
    usuario.password_hash = password_hash;
    usuario.nombre = nombre;
    usuario.rol_id = rolAdmin.id;
    usuario.activo = true;
    await usuario.save();
    console.log(`Usuario Admin existente actualizado: ${email}`);
  } else {
    console.log(`Usuario Admin creado: ${email}`);
  }

  await db.sequelize.close();
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});

require('dotenv').config();
const db = require('../models');
const { PERMISOS_POR_DEFECTO } = require('../config/permisos');

async function migrar() {
  const qi = db.sequelize.getQueryInterface();
  const tabla = await qi.describeTable('roles');

  if (!tabla.permisos) {
    await qi.addColumn('roles', 'permisos', { type: 'JSON', allowNull: true });
    console.log('Columna roles.permisos agregada.');
  }

  await db.sequelize.query("ALTER TABLE roles MODIFY nombre VARCHAR(50) NOT NULL");
  console.log('Columna roles.nombre convertida a VARCHAR(50).');

  for (const [nombre, permisos] of Object.entries(PERMISOS_POR_DEFECTO)) {
    const [rol] = await db.sequelize.query('SELECT id, permisos FROM roles WHERE nombre = ?', {
      replacements: [nombre],
      type: db.sequelize.QueryTypes.SELECT,
    }).then((rows) => [rows[0]]);
    if (rol && !rol.permisos) {
      await db.sequelize.query('UPDATE roles SET permisos = ? WHERE id = ?', {
        replacements: [JSON.stringify(permisos), rol.id],
      });
      console.log(`Permisos por defecto asignados a ${nombre}.`);
    }
  }

  await db.sequelize.query("UPDATE roles SET permisos = '[]' WHERE permisos IS NULL");
  await db.sequelize.query("ALTER TABLE roles MODIFY permisos JSON NOT NULL");

  await db.sequelize.close();
  console.log('Migracion completa.');
}

migrar().catch((err) => {
  console.error(err);
  process.exit(1);
});

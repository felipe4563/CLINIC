require('dotenv').config();
const sequelize = require('../config/database');

// Marca la migracion base como "ya aplicada" SIN ejecutarla, para bases de
// datos que ya tienen ese esquema creado por el viejo sequelize.sync()
// (la dev local, y la de produccion la primera vez que se despliegue este
// cambio). Correrlo de nuevo no hace nada (es idempotente).
//
// Uso:
//   node src/scripts/baselineMigrations.js
//
// Despues de esto, `npm run migrate` no intenta recrear las tablas
// existentes -- solo corre migraciones nuevas que se agreguen despues.

const MIGRACION_BASE = '20260912000000-baseline-schema.js';

async function main() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`SequelizeMeta\` (
      \`name\` VARCHAR(255) NOT NULL,
      PRIMARY KEY (\`name\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [existentes] = await sequelize.query(
    'SELECT name FROM SequelizeMeta WHERE name = ?',
    { replacements: [MIGRACION_BASE] },
  );

  if (existentes.length > 0) {
    console.log(`Ya estaba marcada como aplicada: ${MIGRACION_BASE}`);
  } else {
    await sequelize.query('INSERT INTO SequelizeMeta (name) VALUES (?)', {
      replacements: [MIGRACION_BASE],
    });
    console.log(`Marcada como aplicada: ${MIGRACION_BASE}`);
  }

  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

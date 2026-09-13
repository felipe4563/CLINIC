require('dotenv').config();

// Config para sequelize-cli (npm run migrate / db:migrate). Usa las mismas
// variables de entorno que src/config/database.js (el Sequelize que usa la
// app). development/production comparten config a proposito: en ambos
// casos las variables vienen del .env que corresponda (local o el del VPS),
// no hay diferencia real de configuracion entre uno y otro.
const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'mysql',
};

module.exports = {
  development: base,
  production: base,
  test: base,
};

require('dotenv').config();
const db = require('../models');

async function migrar() {
  const qi = db.sequelize.getQueryInterface();
  const tablaPagos = await qi.describeTable('pagos');

  if (!tablaPagos.saldo_cobrado) {
    await qi.addColumn('pagos', 'saldo_cobrado', { type: 'BOOLEAN', allowNull: false, defaultValue: false });
    console.log('Columna pagos.saldo_cobrado agregada.');
  }

  await db.sequelize.sync();
  console.log('Tabla notas_clinicas verificada/creada.');

  await db.sequelize.close();
  console.log('Migracion completa.');
}

migrar().catch((err) => {
  console.error(err);
  process.exit(1);
});

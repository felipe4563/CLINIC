require('dotenv').config();
const cron = require('node-cron');
const app = require('./app');
const { ejecutarRecordatorios } = require('./jobs/recordatorios');

const PORT = process.env.PORT || 4000;

// El esquema se crea/actualiza con migraciones (`npm run migrate`), no aqui.
// Ver backend/src/migrations/.
app.listen(PORT, () => console.log(`API escuchando en puerto ${PORT}`));

if (process.env.NODE_ENV !== 'test') {
  cron.schedule('*/15 * * * *', () => {
    ejecutarRecordatorios().catch((err) => console.error('Error en job de recordatorios:', err.message));
  });
}

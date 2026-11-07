require('dotenv').config();
// La clínica trabaja en hora de Bolivia. El servidor (VPS/Docker) está en UTC,
// y sin esto la asistencia, las fechas de "hoy" y los recordatorios salían
// 4 horas adelantados. Debe ir antes de que se calcule cualquier fecha.
process.env.TZ = process.env.TZ || 'America/La_Paz';
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

const { Op } = require('sequelize');
const db = require('../models');
const { enviarSiCorresponde } = require('../services/notificacionesAutomaticas');

// Las columnas fecha/hora_inicio de Cita se guardan como hora local "de pared"
// (igual que el resto de la agenda), sin conversion de zona horaria. Por eso
// las ventanas de tiempo se formatean como texto local en vez de pasar
// objetos Date, que Sequelize convertiria a UTC y desalinearia la comparacion.
function pad(n) {
  return String(n).padStart(2, '0');
}

function addMinutos(fecha, minutos) {
  return new Date(fecha.getTime() + minutos * 60000);
}

function formatoLocal(fecha) {
  return (
    `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())} ` +
    `${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:${pad(fecha.getSeconds())}`
  );
}

function formatoFechaLocal(fecha) {
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
}

function timestampCombinado() {
  return db.sequelize.fn('TIMESTAMP', db.sequelize.col('fecha'), db.sequelize.col('hora_inicio'));
}

async function enviarRecordatoriosVentana({ tipo, template, minutosAntes, ventanaMin = 15 }) {
  const ahora = new Date();
  const centro = addMinutos(ahora, minutosAntes);
  const desde = formatoLocal(addMinutos(centro, -ventanaMin));
  const hasta = formatoLocal(addMinutos(centro, ventanaMin));

  const citas = await db.Cita.findAll({
    where: {
      estado: 'confirmada',
      [Op.and]: [db.sequelize.where(timestampCombinado(), { [Op.between]: [desde, hasta] })],
    },
    include: [db.Paciente],
  });

  for (const cita of citas) {
    try {
      await enviarSiCorresponde({
        tipo,
        telefono: cita.Paciente.telefono,
        template: process.env[`WHATSAPP_${tipo.toUpperCase()}_TEMPLATE`],
        parametros: [cita.fecha, cita.hora_inicio.slice(0, 5)],
        citaId: cita.id,
      });
    } catch (err) {
      console.error(`Error enviando ${tipo} para cita ${cita.id}:`, err.message);
    }
  }
}

async function enviarRecordatoriosSaldoPendiente() {
  const hoyISO = formatoFechaLocal(new Date());

  const pagos = await db.Pago.findAll({
    where: { porcentaje: 50, estado: 'pagado', saldo_cobrado: false },
    include: [{ model: db.Cita, as: 'Cita', where: { fecha: { [Op.lt]: hoyISO } }, include: [db.Paciente] }],
  });

  for (const pago of pagos) {
    try {
      const saldo = Number(pago.monto_total) - Number(pago.monto);
      await enviarSiCorresponde({
        tipo: 'saldo_pendiente',
        telefono: pago.Cita.Paciente.telefono,
        template: process.env.WHATSAPP_SALDO_PENDIENTE_TEMPLATE,
        parametros: [pago.Cita.Paciente.nombre_completo, saldo.toFixed(2)],
        pagoId: pago.id,
      });
    } catch (err) {
      console.error(`Error enviando saldo_pendiente para pago ${pago.id}:`, err.message);
    }
  }
}

async function ejecutarRecordatorios() {
  await enviarRecordatoriosVentana({ tipo: 'recordatorio_24h', minutosAntes: 24 * 60 });
  await enviarRecordatoriosVentana({ tipo: 'recordatorio_2h', minutosAntes: 2 * 60 });
  await enviarRecordatoriosSaldoPendiente();
}

module.exports = { ejecutarRecordatorios };

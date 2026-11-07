const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificacionAutomatica = sequelize.define('NotificacionAutomatica', {
  tipo: {
    type: DataTypes.ENUM('recordatorio_24h', 'recordatorio_2h', 'no_show', 'post_consulta', 'saldo_pendiente'),
    allowNull: false,
  },
  enviado_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  // 'fallido' guarda en `error` lo que respondió WhatsApp; se reintenta en la próxima vuelta.
  estado: { type: DataTypes.ENUM('enviado', 'fallido'), allowNull: false, defaultValue: 'enviado' },
  error: { type: DataTypes.STRING(500), allowNull: true },
}, { tableName: 'notificaciones_automaticas', underscored: true });

module.exports = NotificacionAutomatica;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificacionAutomatica = sequelize.define('NotificacionAutomatica', {
  tipo: {
    type: DataTypes.ENUM('recordatorio_24h', 'recordatorio_2h', 'no_show', 'post_consulta', 'saldo_pendiente'),
    allowNull: false,
  },
  enviado_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'notificaciones_automaticas', underscored: true });

module.exports = NotificacionAutomatica;

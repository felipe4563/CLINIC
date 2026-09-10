const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AutomatizacionConfig = sequelize.define('AutomatizacionConfig', {
  recordatorio_24h: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  recordatorio_2h: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  no_show: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  post_consulta: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  saldo_pendiente: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'automatizacion_config', underscored: true });

async function obtenerConfig() {
  const [config] = await AutomatizacionConfig.findOrCreate({ where: { id: 1 }, defaults: { id: 1 } });
  return config;
}

module.exports = AutomatizacionConfig;
module.exports.obtenerConfig = obtenerConfig;

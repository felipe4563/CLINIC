const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TarjetaFidelizacion = sequelize.define('TarjetaFidelizacion', {
  uid: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  estado: { type: DataTypes.ENUM('activa', 'bloqueada'), allowNull: false, defaultValue: 'activa' },
}, { tableName: 'tarjetas_fidelizacion', underscored: true });

module.exports = TarjetaFidelizacion;

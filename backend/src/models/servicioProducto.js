const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Qué usa cada tratamiento y cuánto por sesión: se descuenta al completar la cita.
const ServicioProducto = sequelize.define('ServicioProducto', {
  cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
}, { tableName: 'servicio_producto', underscored: true });

module.exports = ServicioProducto;

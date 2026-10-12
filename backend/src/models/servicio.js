const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Servicio = sequelize.define('Servicio', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  duracion_min: { type: DataTypes.INTEGER, allowNull: false },
  precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  // Sesiones completadas que dan una sesión gratis (tarjeta de sellos). null = sin cartilla.
  sellos_requeridos: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'servicios', underscored: true });

module.exports = Servicio;

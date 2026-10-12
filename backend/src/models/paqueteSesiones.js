const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaqueteSesiones = sequelize.define('PaqueteSesiones', {
  sesiones_totales: { type: DataTypes.INTEGER, allowNull: false },
  sesiones_usadas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  precio_total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  fecha_compra: { type: DataTypes.DATEONLY, allowNull: false },
  estado: { type: DataTypes.ENUM('pendiente', 'pagado'), allowNull: false, defaultValue: 'pagado' },
  referencia_qr: { type: DataTypes.STRING, allowNull: true },
  // Sesión gratis ganada con la tarjeta de sellos: no suma sellos al usarse.
  es_premio: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'paquetes_sesiones', underscored: true });

module.exports = PaqueteSesiones;

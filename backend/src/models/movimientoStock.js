const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Salidas de un producto que no son ventas ni compras: lo que se gastó a mano y
// lo que descontó (o devolvió) una cita completada. `cantidad` siempre es positiva.
const MovimientoStock = sequelize.define('MovimientoStock', {
  tipo: { type: DataTypes.ENUM('uso', 'cita', 'cita_revertida'), allowNull: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  nota: { type: DataTypes.STRING, allowNull: true },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
}, { tableName: 'movimientos_stock', underscored: true });

module.exports = MovimientoStock;

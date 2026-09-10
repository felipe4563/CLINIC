const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VentaItem = sequelize.define('VentaItem', {
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  precio_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, { tableName: 'venta_items', underscored: true });

module.exports = VentaItem;

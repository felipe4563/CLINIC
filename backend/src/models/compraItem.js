const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompraItem = sequelize.define('CompraItem', {
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  costo_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, { tableName: 'compra_items', underscored: true });

module.exports = CompraItem;

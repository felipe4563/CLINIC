const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Compra = sequelize.define('Compra', {
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  nota: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'compras', underscored: true });

module.exports = Compra;

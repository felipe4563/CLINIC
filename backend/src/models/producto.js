const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Producto = sequelize.define('Producto', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  unidad: { type: DataTypes.STRING, allowNull: false, defaultValue: 'unidad' },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  stock_minimo: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  precio_venta: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  precio_costo: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  lote: { type: DataTypes.STRING, allowNull: true },
  fecha_vencimiento: { type: DataTypes.DATEONLY, allowNull: true },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'productos', underscored: true });

module.exports = Producto;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Producto = sequelize.define('Producto', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  // Código del proveedor (factura), opcional.
  codigo: { type: DataTypes.STRING, allowNull: true },
  // Caja del inventario: insumos (jeringas, guantes…), activos (lo que usa la doctora
  // en los tratamientos) o ventas (lo que se vende a los pacientes).
  acapite: { type: DataTypes.ENUM('insumos', 'activos', 'ventas'), allowNull: false, defaultValue: 'ventas' },
  unidad: { type: DataTypes.STRING, allowNull: false, defaultValue: 'unidad' },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  stock_minimo: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  precio_venta: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  precio_costo: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  imagen_url: { type: DataTypes.STRING, allowNull: true },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'productos', underscored: true });

module.exports = Producto;

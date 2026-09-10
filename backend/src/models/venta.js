const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Venta = sequelize.define('Venta', {
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  metodo_pago: { type: DataTypes.ENUM('efectivo', 'qr'), allowNull: false, defaultValue: 'efectivo' },
  estado: { type: DataTypes.ENUM('pendiente', 'pagado'), allowNull: false, defaultValue: 'pagado' },
  referencia_qr: { type: DataTypes.STRING, allowNull: true },
  cliente_nombre: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'ventas', underscored: true });

module.exports = Venta;

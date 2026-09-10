const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pago = sequelize.define('Pago', {
  monto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  monto_total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  porcentaje: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
  estado: {
    type: DataTypes.ENUM('pendiente', 'pagado', 'fallido'),
    defaultValue: 'pendiente',
  },
  referencia_qr_banco: { type: DataTypes.STRING, allowNull: true },
  saldo_cobrado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  metodo_pago_saldo: { type: DataTypes.ENUM('efectivo', 'qr'), allowNull: true },
  referencia_qr_saldo: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'pagos', underscored: true });

module.exports = Pago;

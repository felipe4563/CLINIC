const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pago = sequelize.define('Pago', {
  monto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  estado: {
    type: DataTypes.ENUM('pendiente', 'pagado', 'fallido'),
    defaultValue: 'pendiente',
  },
  referencia_qr_banco: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'pagos', underscored: true });

module.exports = Pago;

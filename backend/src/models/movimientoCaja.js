const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MovimientoCaja = sequelize.define('MovimientoCaja', {
  tipo: { type: DataTypes.ENUM('ingreso', 'egreso'), allowNull: false },
  concepto: { type: DataTypes.STRING, allowNull: false },
  monto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
}, { tableName: 'movimientos_caja', underscored: true });

module.exports = MovimientoCaja;

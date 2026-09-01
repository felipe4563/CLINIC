const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OtpCode = sequelize.define('OtpCode', {
  telefono: { type: DataTypes.STRING, allowNull: false },
  codigo: { type: DataTypes.STRING, allowNull: false },
  expira_en: { type: DataTypes.DATE, allowNull: false },
  usado: { type: DataTypes.BOOLEAN, defaultValue: false },
  intentos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { tableName: 'otp_codes', underscored: true });

module.exports = OtpCode;

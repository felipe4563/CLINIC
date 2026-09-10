const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RegistroAsistencia = sequelize.define('RegistroAsistencia', {
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  hora_entrada: { type: DataTypes.TIME, allowNull: true },
  hora_salida: { type: DataTypes.TIME, allowNull: true },
  observacion: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'registros_asistencia', underscored: true });

module.exports = RegistroAsistencia;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Paciente = sequelize.define('Paciente', {
  codigo_paciente: { type: DataTypes.STRING, unique: true, allowNull: false },
  nombre_completo: { type: DataTypes.STRING, allowNull: false },
  telefono: { type: DataTypes.STRING, unique: true, allowNull: false },
  carnet_identidad: { type: DataTypes.STRING, allowNull: false },
  carnet_complemento: { type: DataTypes.STRING, allowNull: true },
  carnet_expedido: { type: DataTypes.STRING, allowNull: false },
  fecha_nacimiento: { type: DataTypes.DATEONLY, allowNull: true },
}, { tableName: 'pacientes', underscored: true });

module.exports = Paciente;

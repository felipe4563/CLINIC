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
  puntos_actuales: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  sexo: { type: DataTypes.ENUM('F', 'M'), allowNull: true },
  estado_civil: { type: DataTypes.ENUM('S', 'C', 'D', 'V'), allowNull: true },
  grupo_sanguineo: { type: DataTypes.STRING(5), allowNull: true },
  direccion: { type: DataTypes.STRING(255), allowNull: true },
  ocupacion: { type: DataTypes.STRING(120), allowNull: true },
  email: { type: DataTypes.STRING(160), allowNull: true },
  contacto_emergencia: { type: DataTypes.STRING(160), allowNull: true },
  parentesco_emergencia: { type: DataTypes.STRING(60), allowNull: true },
}, { tableName: 'pacientes', underscored: true });

module.exports = Paciente;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Profesional = sequelize.define('Profesional', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  especialidad: { type: DataTypes.STRING, allowNull: true },
  foto_url: { type: DataTypes.STRING, allowNull: true },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'profesionales', underscored: true });

module.exports = Profesional;

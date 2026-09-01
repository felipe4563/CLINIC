const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServicioProfesional = sequelize.define('ServicioProfesional', {
  duracion_min_override: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'servicio_profesional', underscored: true });

module.exports = ServicioProfesional;

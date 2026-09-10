const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotaClinica = sequelize.define('NotaClinica', {
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  hora: { type: DataTypes.TIME, allowNull: true },
  titulo: { type: DataTypes.STRING, allowNull: false },
  notas: { type: DataTypes.TEXT, allowNull: false },
}, { tableName: 'notas_clinicas', underscored: true });

module.exports = NotaClinica;

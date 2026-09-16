const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Recompensa = sequelize.define('Recompensa', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  costo_puntos: { type: DataTypes.INTEGER, allowNull: false },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'recompensas', underscored: true });

module.exports = Recompensa;

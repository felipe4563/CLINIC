const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Lugar de la clínica (consultorio, sala, baño...) con su propio inventario.
const InventarioLugar = sequelize.define('InventarioLugar', {
  nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
  orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { tableName: 'inventario_lugares', underscored: true });

module.exports = InventarioLugar;

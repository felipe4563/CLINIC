const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Especialidades que la clínica agrega desde el Catálogo, además de las fijas
// de la carta de la web (config/categoriasServicio.js). No tienen grupos.
const Especialidad = sequelize.define('Especialidad', {
  nombre: { type: DataTypes.STRING(80), allowNull: false, unique: true },
}, { tableName: 'especialidades', underscored: true });

module.exports = Especialidad;

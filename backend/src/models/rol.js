const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rol = sequelize.define('Rol', {
  nombre: { type: DataTypes.ENUM('Admin', 'Recepcion', 'Profesional'), allowNull: false, unique: true },
}, { tableName: 'roles', underscored: true });

module.exports = Rol;

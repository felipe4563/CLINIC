const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Marca = sequelize.define('Marca', {
  nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { tableName: 'marcas', underscored: true });

module.exports = Marca;

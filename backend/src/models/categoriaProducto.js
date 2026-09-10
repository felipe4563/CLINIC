const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CategoriaProducto = sequelize.define('CategoriaProducto', {
  nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { tableName: 'categorias_producto', underscored: true });

module.exports = CategoriaProducto;

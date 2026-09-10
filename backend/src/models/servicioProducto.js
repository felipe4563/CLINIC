const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServicioProducto = sequelize.define('ServicioProducto', {}, { tableName: 'servicio_producto', underscored: true });

module.exports = ServicioProducto;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Proveedor = sequelize.define('Proveedor', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  contacto: { type: DataTypes.STRING, allowNull: true },
  telefono: { type: DataTypes.STRING, allowNull: true },
  notas: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'proveedores', underscored: true });

module.exports = Proveedor;

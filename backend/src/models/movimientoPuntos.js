const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MovimientoPuntos = sequelize.define('MovimientoPuntos', {
  tipo: { type: DataTypes.ENUM('ganado', 'canje', 'ajuste'), allowNull: false },
  puntos: { type: DataTypes.INTEGER, allowNull: false },
  motivo: { type: DataTypes.STRING, allowNull: false },
}, { tableName: 'movimientos_puntos', underscored: true });

module.exports = MovimientoPuntos;

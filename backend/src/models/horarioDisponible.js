const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HorarioDisponible = sequelize.define('HorarioDisponible', {
  dia_semana: { type: DataTypes.INTEGER, allowNull: false }, // 0=domingo..6=sabado
  hora_inicio: { type: DataTypes.TIME, allowNull: false },
  hora_fin: { type: DataTypes.TIME, allowNull: false },
}, { tableName: 'horarios_disponibles', underscored: true });

module.exports = HorarioDisponible;

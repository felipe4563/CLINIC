const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cita = sequelize.define('Cita', {
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  hora_inicio: { type: DataTypes.TIME, allowNull: false },
  hora_fin: { type: DataTypes.TIME, allowNull: false },
  estado: {
    type: DataTypes.ENUM('pendiente_pago', 'confirmada', 'cancelada', 'completada', 'no_asistio'),
    defaultValue: 'pendiente_pago',
  },
}, { tableName: 'citas', underscored: true });

module.exports = Cita;

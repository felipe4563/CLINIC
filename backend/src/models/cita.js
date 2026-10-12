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
  politica_aceptada_en: { type: DataTypes.DATE, allowNull: true },
  justificacion_estado: { type: DataTypes.ENUM('aceptada', 'rechazada'), allowNull: true },
  justificacion_archivo: { type: DataTypes.STRING, allowNull: true },
  justificacion_nota: { type: DataTypes.TEXT, allowNull: true },
  justificacion_registrada_en: { type: DataTypes.DATE, allowNull: true },
  reprogramacion_usada: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  fecha_original: { type: DataTypes.DATEONLY, allowNull: true },
  hora_original: { type: DataTypes.TIME, allowNull: true },
}, { tableName: 'citas', underscored: true });

module.exports = Cita;

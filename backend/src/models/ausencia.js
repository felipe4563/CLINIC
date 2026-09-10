const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ausencia = sequelize.define('Ausencia', {
  tipo: {
    type: DataTypes.ENUM('vacacion', 'licencia_medica', 'permiso', 'falta_justificada', 'falta_injustificada'),
    allowNull: false,
  },
  fecha_desde: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_hasta: { type: DataTypes.DATEONLY, allowNull: false },
  motivo: { type: DataTypes.TEXT, allowNull: true },
  estado: {
    type: DataTypes.ENUM('pendiente', 'aprobado', 'rechazado'),
    allowNull: false,
    defaultValue: 'pendiente',
  },
}, { tableName: 'ausencias', underscored: true });

module.exports = Ausencia;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivoClinica = sequelize.define('ActivoClinica', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  categoria: { type: DataTypes.STRING, allowNull: true },
  marca: { type: DataTypes.STRING, allowNull: true },
  modelo: { type: DataTypes.STRING, allowNull: true },
  numero_serie: { type: DataTypes.STRING, allowNull: true },
  ubicacion: { type: DataTypes.STRING, allowNull: true },
  fecha_adquisicion: { type: DataTypes.DATEONLY, allowNull: true },
  valor_adquisicion: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  estado: {
    type: DataTypes.ENUM('operativo', 'mantenimiento', 'dado_de_baja'),
    allowNull: false,
    defaultValue: 'operativo',
  },
  fecha_baja: { type: DataTypes.DATEONLY, allowNull: true },
  motivo_baja: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'activos_clinica', underscored: true });

module.exports = ActivoClinica;

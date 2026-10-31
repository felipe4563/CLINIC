const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Salida de un mueble o equipo del inventario a mantenimiento y su regreso.
// Mientras no tiene fecha_regreso, esas unidades están fuera de la clínica.
// El costo se paga al recoger y sale de caja (movimiento_caja_id).
const MantenimientoEquipo = sequelize.define('MantenimientoEquipo', {
  cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  fecha_salida: { type: DataTypes.DATEONLY, allowNull: false },
  motivo: { type: DataTypes.TEXT, allowNull: true },
  destino: { type: DataTypes.STRING, allowNull: true },
  fecha_regreso: { type: DataTypes.DATEONLY, allowNull: true },
  trabajo_realizado: { type: DataTypes.TEXT, allowNull: true },
  costo: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
}, { tableName: 'mantenimientos_equipo', underscored: true });

// Solo muebles y equipos van a mantenimiento; los insumos y activos se gastan.
MantenimientoEquipo.TIPOS_ITEM = ['equipamiento', 'equipos', 'decorativos'];

module.exports = MantenimientoEquipo;

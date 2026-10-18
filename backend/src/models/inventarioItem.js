const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tipos y estados del inventario por lugar (planillas de la doctora).
const TIPOS_INVENTARIO = ['equipamiento', 'equipos', 'insumos', 'activos', 'decorativos'];
const ESTADOS_INVENTARIO = ['bueno', 'mantenimiento', 'baja'];

// Material de la oficina en un lugar. `cantidad` puede quedar vacía cuando la
// planilla no la indica. El tiempo de uso se calcula desde `fecha_ingreso`.
const InventarioItem = sequelize.define('InventarioItem', {
  tipo: { type: DataTypes.ENUM(...TIPOS_INVENTARIO), allowNull: false },
  nombre: { type: DataTypes.STRING(500), allowNull: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: true },
  estado: { type: DataTypes.ENUM(...ESTADOS_INVENTARIO), allowNull: false, defaultValue: 'bueno' },
  fecha_ingreso: { type: DataTypes.DATEONLY, allowNull: true },
  observacion: { type: DataTypes.TEXT, allowNull: true },
  orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { tableName: 'inventario_items', underscored: true });

InventarioItem.TIPOS = TIPOS_INVENTARIO;
InventarioItem.ESTADOS = ESTADOS_INVENTARIO;

module.exports = InventarioItem;

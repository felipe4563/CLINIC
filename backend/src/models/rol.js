const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rol = sequelize.define('Rol', {
  nombre: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  permisos: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    get() {
      const raw = this.getDataValue('permisos');
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch {
          return [];
        }
      }
      return raw || [];
    },
    set(value) {
      this.setDataValue('permisos', Array.isArray(value) ? value : []);
    },
  },
}, { tableName: 'roles', underscored: true });

module.exports = Rol;

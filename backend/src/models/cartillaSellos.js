const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CartillaSellos = sequelize.define('CartillaSellos', {
  sellos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  premios_ganados: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'cartillas_sellos',
  underscored: true,
  indexes: [{ unique: true, fields: ['paciente_id', 'servicio_id'] }],
});

module.exports = CartillaSellos;

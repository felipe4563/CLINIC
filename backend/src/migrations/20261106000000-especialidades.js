'use strict';

// Especialidades nuevas que se agregan desde el Catálogo (las cinco de la web
// siguen fijas en config/categoriasServicio.js). La clave es INT con signo,
// igual que los ids de producción.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('especialidades', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      nombre: { type: Sequelize.STRING(80), allowNull: false, unique: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('especialidades');
  },
};

'use strict';

// Cómo conoció la paciente a la clínica: se pregunta al crear la ficha desde la web.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('pacientes', 'como_nos_conocio', { type: Sequelize.STRING(60), allowNull: true, after: 'email' });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('pacientes', 'como_nos_conocio');
  },
};

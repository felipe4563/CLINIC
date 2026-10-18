'use strict';

// Registro profesional del médico: se imprime en el consentimiento informado.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('profesionales', 'registro_profesional', { type: Sequelize.STRING, allowNull: true, after: 'especialidad' });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('profesionales', 'registro_profesional');
  },
};

'use strict';

// La reserva web pide la edad en vez de la fecha de nacimiento. Se guarda junto
// con el día en que se dijo, para que la edad siga al día con los años.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('pacientes', 'edad', { type: Sequelize.INTEGER, allowNull: true, after: 'fecha_nacimiento' });
    await queryInterface.addColumn('pacientes', 'edad_fecha', { type: Sequelize.DATEONLY, allowNull: true, after: 'edad' });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('pacientes', 'edad_fecha');
    await queryInterface.removeColumn('pacientes', 'edad');
  },
};

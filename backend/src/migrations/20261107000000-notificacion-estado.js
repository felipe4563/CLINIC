'use strict';

// Los mensajes automáticos que WhatsApp rechaza quedan registrados como
// 'fallido' con el motivo, para verlos en Automatización (antes no quedaba rastro).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('notificaciones_automaticas', 'estado', {
      type: Sequelize.ENUM('enviado', 'fallido'), allowNull: false, defaultValue: 'enviado', after: 'enviado_at',
    });
    await queryInterface.addColumn('notificaciones_automaticas', 'error', { type: Sequelize.STRING(500), allowNull: true, after: 'estado' });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('notificaciones_automaticas', 'error');
    await queryInterface.removeColumn('notificaciones_automaticas', 'estado');
  },
};

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const configCols = await queryInterface.describeTable('configuracion_clinica');
    if (!configCols.asistencia_lat) {
      await queryInterface.addColumn('configuracion_clinica', 'asistencia_lat', {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
      });
    }
    if (!configCols.asistencia_lng) {
      await queryInterface.addColumn('configuracion_clinica', 'asistencia_lng', {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
      });
    }
    if (!configCols.asistencia_radio_metros) {
      await queryInterface.addColumn('configuracion_clinica', 'asistencia_radio_metros', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 150,
      });
    }

    const registrosCols = await queryInterface.describeTable('registros_asistencia');
    if (!registrosCols.lat) {
      await queryInterface.addColumn('registros_asistencia', 'lat', { type: Sequelize.DECIMAL(10, 7), allowNull: true });
    }
    if (!registrosCols.lng) {
      await queryInterface.addColumn('registros_asistencia', 'lng', { type: Sequelize.DECIMAL(10, 7), allowNull: true });
    }
    if (!registrosCols.precision_metros) {
      await queryInterface.addColumn('registros_asistencia', 'precision_metros', { type: Sequelize.INTEGER, allowNull: true });
    }
    if (!registrosCols.dentro_rango) {
      await queryInterface.addColumn('registros_asistencia', 'dentro_rango', { type: Sequelize.BOOLEAN, allowNull: true });
    }
  },

  async down(queryInterface) {
    const configCols = await queryInterface.describeTable('configuracion_clinica');
    if (configCols.asistencia_lat) await queryInterface.removeColumn('configuracion_clinica', 'asistencia_lat');
    if (configCols.asistencia_lng) await queryInterface.removeColumn('configuracion_clinica', 'asistencia_lng');
    if (configCols.asistencia_radio_metros) await queryInterface.removeColumn('configuracion_clinica', 'asistencia_radio_metros');

    const registrosCols = await queryInterface.describeTable('registros_asistencia');
    if (registrosCols.lat) await queryInterface.removeColumn('registros_asistencia', 'lat');
    if (registrosCols.lng) await queryInterface.removeColumn('registros_asistencia', 'lng');
    if (registrosCols.precision_metros) await queryInterface.removeColumn('registros_asistencia', 'precision_metros');
    if (registrosCols.dentro_rango) await queryInterface.removeColumn('registros_asistencia', 'dentro_rango');
  },
};

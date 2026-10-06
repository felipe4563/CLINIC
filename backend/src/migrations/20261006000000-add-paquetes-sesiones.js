'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('paquetes_sesiones', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      paciente_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'pacientes', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      servicio_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'servicios', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      sesiones_totales: { type: Sequelize.INTEGER, allowNull: false },
      sesiones_usadas: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      precio_total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      fecha_compra: { type: Sequelize.DATEONLY, allowNull: false },
      estado: { type: Sequelize.ENUM('pendiente', 'pagado'), allowNull: false, defaultValue: 'pagado' },
      referencia_qr: { type: Sequelize.STRING, allowNull: true },
      usuario_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addColumn('movimientos_caja', 'paquete_sesiones_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'paquetes_sesiones', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addColumn('citas', 'paquete_sesiones_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'paquetes_sesiones', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('citas', 'paquete_sesiones_id');
    await queryInterface.removeColumn('movimientos_caja', 'paquete_sesiones_id');
    await queryInterface.dropTable('paquetes_sesiones');
  },
};

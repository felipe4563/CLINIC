'use strict';

// Mantenimiento de muebles y equipos del inventario por lugar: cuándo salió,
// cuántos, a dónde, cuándo volvió y cuánto costó (el costo sale de caja).
// Las claves son INT con signo, igual que los ids de producción.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('mantenimientos_equipo', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      inventario_item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'inventario_items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      cantidad: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      fecha_salida: { type: Sequelize.DATEONLY, allowNull: false },
      motivo: { type: Sequelize.TEXT, allowNull: true },
      destino: { type: Sequelize.STRING, allowNull: true },
      fecha_regreso: { type: Sequelize.DATEONLY, allowNull: true },
      trabajo_realizado: { type: Sequelize.TEXT, allowNull: true },
      costo: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      movimiento_caja_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'movimientos_caja', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      usuario_salida_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      usuario_regreso_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('mantenimientos_equipo', ['fecha_regreso']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('mantenimientos_equipo');
  },
};

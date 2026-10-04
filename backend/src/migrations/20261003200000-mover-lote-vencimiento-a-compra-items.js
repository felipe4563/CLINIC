'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('compra_items', 'lote', { type: Sequelize.STRING(100), allowNull: true });
    await queryInterface.addColumn('compra_items', 'fecha_vencimiento', { type: Sequelize.DATEONLY, allowNull: true });
    await queryInterface.addIndex('compra_items', ['fecha_vencimiento'], { name: 'compra_items_fecha_vencimiento_idx' });

    await queryInterface.removeIndex('productos', 'productos_fecha_vencimiento_idx');
    await queryInterface.removeColumn('productos', 'lote');
    await queryInterface.removeColumn('productos', 'fecha_vencimiento');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('productos', 'lote', { type: Sequelize.STRING(100), allowNull: true });
    await queryInterface.addColumn('productos', 'fecha_vencimiento', { type: Sequelize.DATEONLY, allowNull: true });
    await queryInterface.addIndex('productos', ['fecha_vencimiento'], { name: 'productos_fecha_vencimiento_idx' });

    await queryInterface.removeIndex('compra_items', 'compra_items_fecha_vencimiento_idx');
    await queryInterface.removeColumn('compra_items', 'lote');
    await queryInterface.removeColumn('compra_items', 'fecha_vencimiento');
  },
};

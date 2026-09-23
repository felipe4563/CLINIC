'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('proveedores', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING, allowNull: false },
      contacto: { type: Sequelize.STRING, allowNull: true },
      telefono: { type: Sequelize.STRING, allowNull: true },
      notas: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('compras', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      fecha: { type: Sequelize.DATEONLY, allowNull: false },
      total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      nota: { type: Sequelize.STRING, allowNull: true },
      proveedor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'proveedores', key: 'id' },
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('compra_items', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      cantidad: { type: Sequelize.INTEGER, allowNull: false },
      costo_unitario: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      subtotal: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      compra_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'compras', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      producto_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'productos', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addColumn('movimientos_caja', 'compra_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'compras', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('movimientos_caja', 'compra_id');
    await queryInterface.dropTable('compra_items');
    await queryInterface.dropTable('compras');
    await queryInterface.dropTable('proveedores');
  },
};

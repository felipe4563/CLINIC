'use strict';

// Inventario en 3 cajas: insumos (jeringas, guantes…), activos (lo que usa la
// doctora en los tratamientos) y ventas (lo que se vende). El acápite viejo
// "mantenimiento" (limpieza) pasa a insumos: mantenimiento ahora es de equipos.
// Cada tratamiento dice cuánto usa de cada producto, y al completar la cita se
// descuenta; movimientos_stock guarda esos usos para el historial del producto.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('productos', 'acapite', {
      type: Sequelize.ENUM('insumos', 'activos', 'ventas', 'mantenimiento'), allowNull: false, defaultValue: 'ventas',
    });
    await queryInterface.sequelize.query("UPDATE productos SET acapite = 'insumos' WHERE acapite = 'mantenimiento'");
    await queryInterface.changeColumn('productos', 'acapite', {
      type: Sequelize.ENUM('insumos', 'activos', 'ventas'), allowNull: false, defaultValue: 'ventas',
    });

    await queryInterface.addColumn('servicio_producto', 'cantidad', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 });

    await queryInterface.createTable('movimientos_stock', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      producto_id: {
        type: Sequelize.INTEGER, allowNull: false, references: { model: 'productos', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      // uso: se gastó a mano; cita: lo descontó un tratamiento; cita_revertida: se devolvió.
      tipo: { type: Sequelize.ENUM('uso', 'cita', 'cita_revertida'), allowNull: false },
      cantidad: { type: Sequelize.INTEGER, allowNull: false },
      cita_id: {
        type: Sequelize.INTEGER, allowNull: true, references: { model: 'citas', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      usuario_id: {
        type: Sequelize.INTEGER, allowNull: true, references: { model: 'usuarios', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      nota: { type: Sequelize.STRING, allowNull: true },
      fecha: { type: Sequelize.DATEONLY, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('movimientos_stock', ['producto_id', 'fecha']);
    await queryInterface.addIndex('movimientos_stock', ['cita_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('movimientos_stock');
    await queryInterface.removeColumn('servicio_producto', 'cantidad');
    await queryInterface.changeColumn('productos', 'acapite', {
      type: Sequelize.ENUM('insumos', 'activos', 'ventas', 'mantenimiento'), allowNull: false, defaultValue: 'ventas',
    });
    await queryInterface.sequelize.query("UPDATE productos SET acapite = 'mantenimiento' WHERE acapite = 'insumos'");
    await queryInterface.changeColumn('productos', 'acapite', {
      type: Sequelize.ENUM('activos', 'ventas', 'mantenimiento'), allowNull: false, defaultValue: 'ventas',
    });
  },
};

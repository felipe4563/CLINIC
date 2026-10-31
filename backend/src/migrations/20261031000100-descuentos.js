'use strict';

// Descuentos: en Ventas un % sobre toda la venta; en tratamientos un monto en Bs
// al crear la cita. El total y el monto_total ya guardan el precio con descuento;
// estas columnas dejan constancia de cuánto se descontó.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ventas', 'subtotal', { type: Sequelize.DECIMAL(10, 2), allowNull: true, after: 'fecha' });
    await queryInterface.addColumn('ventas', 'descuento_porcentaje', { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0, after: 'subtotal' });
    await queryInterface.addColumn('pagos', 'descuento', { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0, after: 'monto_total' });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('pagos', 'descuento');
    await queryInterface.removeColumn('ventas', 'descuento_porcentaje');
    await queryInterface.removeColumn('ventas', 'subtotal');
  },
};

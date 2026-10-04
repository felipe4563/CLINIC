'use strict';

async function indiceExiste(queryInterface, tabla, nombreIndice, transaction) {
  const [filas] = await queryInterface.sequelize.query(
    'SHOW INDEX FROM `' + tabla + '` WHERE Key_name = ?',
    { replacements: [nombreIndice], transaction },
  );
  return filas.length > 0;
}

module.exports = {
  // Idempotente: cada paso verifica el estado real de la tabla antes de actuar, y todo corre
  // dentro de una transaccion. Esto es necesario porque un primer intento en produccion fallo
  // a mitad de camino (el indice productos_fecha_vencimiento_idx no existia con ese nombre) y,
  // al no haber transaccion, los pasos anteriores (columnas en compra_items) quedaron aplicados
  // sin que la migracion se marcara como completa, causando reintentos con "Duplicate column".
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const compraItemsCols = await queryInterface.describeTable('compra_items');
      if (!compraItemsCols.lote) {
        await queryInterface.addColumn('compra_items', 'lote', { type: Sequelize.STRING(100), allowNull: true }, { transaction });
      }
      if (!compraItemsCols.fecha_vencimiento) {
        await queryInterface.addColumn('compra_items', 'fecha_vencimiento', { type: Sequelize.DATEONLY, allowNull: true }, { transaction });
      }
      if (!(await indiceExiste(queryInterface, 'compra_items', 'compra_items_fecha_vencimiento_idx', transaction))) {
        await queryInterface.addIndex('compra_items', ['fecha_vencimiento'], { name: 'compra_items_fecha_vencimiento_idx', transaction });
      }

      if (await indiceExiste(queryInterface, 'productos', 'productos_fecha_vencimiento_idx', transaction)) {
        await queryInterface.removeIndex('productos', 'productos_fecha_vencimiento_idx', { transaction });
      }

      const productosCols = await queryInterface.describeTable('productos');
      if (productosCols.lote) {
        await queryInterface.removeColumn('productos', 'lote', { transaction });
      }
      if (productosCols.fecha_vencimiento) {
        await queryInterface.removeColumn('productos', 'fecha_vencimiento', { transaction });
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const productosCols = await queryInterface.describeTable('productos');
      if (!productosCols.lote) {
        await queryInterface.addColumn('productos', 'lote', { type: Sequelize.STRING(100), allowNull: true }, { transaction });
      }
      if (!productosCols.fecha_vencimiento) {
        await queryInterface.addColumn('productos', 'fecha_vencimiento', { type: Sequelize.DATEONLY, allowNull: true }, { transaction });
      }
      if (!(await indiceExiste(queryInterface, 'productos', 'productos_fecha_vencimiento_idx', transaction))) {
        await queryInterface.addIndex('productos', ['fecha_vencimiento'], { name: 'productos_fecha_vencimiento_idx', transaction });
      }

      if (await indiceExiste(queryInterface, 'compra_items', 'compra_items_fecha_vencimiento_idx', transaction)) {
        await queryInterface.removeIndex('compra_items', 'compra_items_fecha_vencimiento_idx', { transaction });
      }

      const compraItemsCols = await queryInterface.describeTable('compra_items');
      if (compraItemsCols.lote) {
        await queryInterface.removeColumn('compra_items', 'lote', { transaction });
      }
      if (compraItemsCols.fecha_vencimiento) {
        await queryInterface.removeColumn('compra_items', 'fecha_vencimiento', { transaction });
      }
    });
  },
};

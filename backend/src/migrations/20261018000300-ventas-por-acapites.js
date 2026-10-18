'use strict';

// Pedido de la doctora (15/10/2026): Ventas por acápites (activos, ventas y
// mantenimiento), solo con qué producto y cuántos hay. Se borran los productos
// de ejemplo de la carga inicial (agujas, toxina...: "yo no vendo una aguja")
// y las marcas y categorías que quedan sin uso. Lo cargado después se conserva.
const FIN_CARGA_INICIAL = '2026-10-13 00:00:00';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('productos', 'acapite', {
      type: Sequelize.ENUM('activos', 'ventas', 'mantenimiento'), allowNull: false, defaultValue: 'ventas', after: 'codigo',
    });
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql) => queryInterface.sequelize.query(sql, { replacements: [FIN_CARGA_INICIAL], transaction });
      // Solo los de ejemplo sin ventas ni ingresos (venta_items y compra_items no dejan borrar).
      // Primero los ids: MySQL no deja borrar de una tabla leyendo de ella misma.
      const [filas] = await q(`SELECT p.id FROM productos p WHERE p.created_at < ?
        AND NOT EXISTS (SELECT 1 FROM venta_items v WHERE v.producto_id = p.id)
        AND NOT EXISTS (SELECT 1 FROM compra_items c WHERE c.producto_id = p.id)`);
      const ids = filas.map((f) => f.id);
      if (ids.length) {
        await queryInterface.sequelize.query('DELETE FROM servicio_producto WHERE producto_id IN (?)', { replacements: [ids], transaction });
        await queryInterface.sequelize.query('DELETE FROM productos WHERE id IN (?)', { replacements: [ids], transaction });
      }
      await q(`DELETE FROM marcas WHERE created_at < ? AND id NOT IN (SELECT marca_id FROM productos WHERE marca_id IS NOT NULL)`);
      await q(`DELETE FROM categorias_producto WHERE created_at < ? AND id NOT IN (SELECT categoria_id FROM productos WHERE categoria_id IS NOT NULL)`);
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('productos', 'acapite');
  },
};

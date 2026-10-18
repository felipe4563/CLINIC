'use strict';

// Pedido de la doctora (15/10/2026): el inventario es el material de la
// oficina, separado por lugar, tal cual sus planillas (src/data/inventarioDoctora.json).
// También: se borran los activos de ejemplo de la carga inicial y se agregan
// los productos de la factura que mandó (código del proveedor, 10 unidades).
const LUGARES = require('../data/inventarioDoctora.json');

const MARCA_FACTURA = 'Sesderma';
// [código, nombre, unidades] de la foto del 15/10 10:56. El precio lo pone la clínica.
const PRODUCTOS_FACTURA = [
  ['40000109', 'Abradermol crema microdermoabrasión 50 g', 10],
  ['40000995', 'Sesgen-32 crema activadora celular 50 ml', 10],
  ['40002447', 'C-Vit liposomal sérum 30 ml', 10],
  ['40007512', 'Salises crema espumosa sin jabón 250 ml', 10],
  ['40007826', 'Sesbalance sérum seborregulador 30 ml', 10],
  ['40007943', 'Retisil crema intensiva 50 ml', 10],
  ['40007945', 'Retisil contorno de ojos y labios 30 ml', 10],
  ['40008198', 'Repaskin tacto seda color SPF50 50 ml', 10],
  ['40008199', 'Repaskin tacto seda SPF50 50 ml', 10],
  ['40008628', 'Hidraven crema espumosa sin jabón 300 ml', 10],
];

// Los activos de ejemplo entraron con la carga inicial (12/10); los que la
// clínica haya cargado después se conservan.
const FIN_CARGA_INICIAL = '2026-10-13 00:00:00';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventario_lugares', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      nombre: { type: Sequelize.STRING, allowNull: false, unique: true },
      orden: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('inventario_items', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      lugar_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'inventario_lugares', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      tipo: { type: Sequelize.ENUM('equipamiento', 'equipos', 'insumos', 'activos', 'decorativos'), allowNull: false },
      nombre: { type: Sequelize.STRING(500), allowNull: false },
      cantidad: { type: Sequelize.INTEGER, allowNull: true },
      estado: { type: Sequelize.ENUM('bueno', 'mantenimiento', 'baja'), allowNull: false, defaultValue: 'bueno' },
      fecha_ingreso: { type: Sequelize.DATEONLY, allowNull: true },
      observacion: { type: Sequelize.TEXT, allowNull: true },
      orden: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addColumn('productos', 'codigo', { type: Sequelize.STRING, allowNull: true, after: 'nombre' });

    await queryInterface.sequelize.transaction(async (transaction) => {
      const ahora = new Date();
      await queryInterface.bulkInsert('inventario_lugares',
        LUGARES.map((l, i) => ({ nombre: l.nombre, orden: i + 1, created_at: ahora, updated_at: ahora })), { transaction });
      const [filas] = await queryInterface.sequelize.query('SELECT id, nombre FROM inventario_lugares', { transaction });
      const idDe = Object.fromEntries(filas.map((f) => [f.nombre, f.id]));
      const items = LUGARES.flatMap((l) => l.items.map((it, i) => ({
        lugar_id: idDe[l.nombre], tipo: it.tipo, nombre: it.nombre, cantidad: it.cantidad, estado: 'bueno', orden: i + 1, created_at: ahora, updated_at: ahora,
      })));
      if (items.length) await queryInterface.bulkInsert('inventario_items', items, { transaction });

      await queryInterface.sequelize.query('DELETE FROM activos_clinica WHERE created_at < ?', { replacements: [FIN_CARGA_INICIAL], transaction });

      const [marca] = await queryInterface.sequelize.query('SELECT id FROM marcas WHERE nombre = ?', { replacements: [MARCA_FACTURA], transaction });
      let marcaId = marca[0] && marca[0].id;
      if (!marcaId) {
        await queryInterface.bulkInsert('marcas', [{ nombre: MARCA_FACTURA, created_at: ahora, updated_at: ahora }], { transaction });
        const [nueva] = await queryInterface.sequelize.query('SELECT id FROM marcas WHERE nombre = ?', { replacements: [MARCA_FACTURA], transaction });
        marcaId = nueva[0].id;
      }
      for (const [codigo, nombre, stock] of PRODUCTOS_FACTURA) {
        const [existe] = await queryInterface.sequelize.query('SELECT id FROM productos WHERE codigo = ?', { replacements: [codigo], transaction });
        if (existe.length) continue;
        await queryInterface.bulkInsert('productos', [{
          nombre, codigo, unidad: 'unidad', stock, stock_minimo: 0, precio_venta: 0, activo: true, marca_id: marcaId, created_at: ahora, updated_at: ahora,
        }], { transaction });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DELETE FROM productos WHERE codigo IN (?)', { replacements: [PRODUCTOS_FACTURA.map((p) => p[0])] });
    await queryInterface.removeColumn('productos', 'codigo');
    await queryInterface.dropTable('inventario_items');
    await queryInterface.dropTable('inventario_lugares');
  },
};

// backend/src/migrations/20261013000000-tarjeta-sellos.js
'use strict';

// Ver 20261006000000-add-paquetes-sesiones.js: en producción los `id` viejos
// son INT con signo, y MySQL exige que la FK tenga el mismo tipo.
async function tipoIdDe(queryInterface, Sequelize, tabla) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'id'`,
    { replacements: [tabla] }
  );
  const unsigned = rows.length && /unsigned/i.test(rows[0].COLUMN_TYPE);
  return unsigned ? Sequelize.INTEGER.UNSIGNED : Sequelize.INTEGER;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const tipoPaciente = await tipoIdDe(queryInterface, Sequelize, 'pacientes');
    const tipoServicio = await tipoIdDe(queryInterface, Sequelize, 'servicios');

    // Cuántas sesiones completadas dan una sesión gratis. NULL = sin cartilla.
    await queryInterface.addColumn('servicios', 'sellos_requeridos', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn('paquetes_sesiones', 'es_premio', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('citas', 'sello_otorgado', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.createTable('tarjetas_fidelizacion', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      paciente_id: {
        type: tipoPaciente,
        allowNull: false,
        references: { model: 'pacientes', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      uid: { type: Sequelize.STRING(64), allowNull: false, unique: true },
      estado: { type: Sequelize.ENUM('activa', 'bloqueada'), allowNull: false, defaultValue: 'activa' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('cartillas_sellos', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      paciente_id: {
        type: tipoPaciente,
        allowNull: false,
        references: { model: 'pacientes', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      servicio_id: {
        type: tipoServicio,
        allowNull: false,
        references: { model: 'servicios', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      sellos: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      premios_ganados: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('cartillas_sellos', ['paciente_id', 'servicio_id'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cartillas_sellos');
    await queryInterface.dropTable('tarjetas_fidelizacion');
    await queryInterface.removeColumn('citas', 'sello_otorgado');
    await queryInterface.removeColumn('paquetes_sesiones', 'es_premio');
    await queryInterface.removeColumn('servicios', 'sellos_requeridos');
  },
};

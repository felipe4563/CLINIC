'use strict';

// La base de produccion original tiene algunos `id` como INT firmado (creada
// via sequelize.sync() antes de existir las migraciones) y una base nueva los
// tiene UNSIGNED (migracion baseline). MySQL exige que la FK tenga exactamente
// el mismo tipo que la columna referenciada, asi que se lee el tipo real.
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
    const tipoUsuario = await tipoIdDe(queryInterface, Sequelize, 'usuarios');

    await queryInterface.createTable('paquetes_sesiones', {
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
        type: tipoUsuario,
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

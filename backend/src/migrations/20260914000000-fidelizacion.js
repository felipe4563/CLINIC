'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('pacientes', 'puntos_actuales', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('configuracion_clinica', 'bs_por_punto', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 10,
    });

    // Nota: las tablas existentes (pacientes, citas, ventas, usuarios) fueron
    // creadas originalmente por sequelize.sync() con INT firmado (no UNSIGNED)
    // como PK, aunque el DDL documentado en la migracion baseline diga
    // "INT UNSIGNED". Las FK de aqui deben coincidir con el tipo REAL de la
    // base de datos existente (INT firmado), no con el documentado.
    await queryInterface.createTable('recompensas', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING, allowNull: false },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
      costo_puntos: { type: Sequelize.INTEGER, allowNull: false },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('movimientos_puntos', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      paciente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'pacientes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      tipo: { type: Sequelize.ENUM('ganado', 'canje', 'ajuste'), allowNull: false },
      puntos: { type: Sequelize.INTEGER, allowNull: false },
      motivo: { type: Sequelize.STRING, allowNull: false },
      cita_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'citas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      venta_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'ventas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      recompensa_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'recompensas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('movimientos_puntos', ['paciente_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('movimientos_puntos');
    await queryInterface.dropTable('recompensas');
    await queryInterface.removeColumn('configuracion_clinica', 'bs_por_punto');
    await queryInterface.removeColumn('pacientes', 'puntos_actuales');
  },
};

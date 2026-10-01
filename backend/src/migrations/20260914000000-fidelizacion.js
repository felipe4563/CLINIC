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

    // Nota: la migracion baseline crea pacientes/citas/ventas/usuarios con
    // `id` INT UNSIGNED, asi que las FK de aqui deben ser UNSIGNED tambien
    // para que esta migracion funcione en una base nueva (dev local, CI,
    // otro entorno). La base de produccion original tiene esos PKs como INT
    // firmado (por haber sido creada via sequelize.sync() antes de que
    // existieran las migraciones), pero esta migracion ya quedo aplicada
    // ahi hace tiempo, asi que este cambio de tipo no la vuelve a ejecutar.
    await queryInterface.createTable('recompensas', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING, allowNull: false },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
      costo_puntos: { type: Sequelize.INTEGER, allowNull: false },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('movimientos_puntos', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      paciente_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'pacientes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      tipo: { type: Sequelize.ENUM('ganado', 'canje', 'ajuste'), allowNull: false },
      puntos: { type: Sequelize.INTEGER, allowNull: false },
      motivo: { type: Sequelize.STRING, allowNull: false },
      cita_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'citas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      venta_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'ventas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      recompensa_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'recompensas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      usuario_id: {
        type: Sequelize.INTEGER.UNSIGNED,
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

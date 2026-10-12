// backend/src/migrations/20261012000000-reserva-qr-fijo-comprobante.js
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

const COLUMNAS_CITAS = [
  'politica_aceptada_en',
  'justificacion_estado',
  'justificacion_archivo',
  'justificacion_nota',
  'justificacion_registrada_en',
  'reprogramacion_usada',
  'fecha_original',
  'hora_original',
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const tipoUsuario = await tipoIdDe(queryInterface, Sequelize, 'usuarios');

    // configuracion_clinica: el interruptor pasa a ser una elección de tres modos.
    await queryInterface.addColumn('configuracion_clinica', 'metodo_pago_online', {
      type: Sequelize.ENUM('ninguno', 'qr_banco', 'qr_fijo'),
      allowNull: false,
      defaultValue: 'qr_banco',
    });
    await queryInterface.sequelize.query(
      "UPDATE configuracion_clinica SET metodo_pago_online = IF(cobra_adelanto_online = 1, 'qr_banco', 'ninguno')"
    );
    await queryInterface.removeColumn('configuracion_clinica', 'cobra_adelanto_online');
    await queryInterface.addColumn('configuracion_clinica', 'qr_fijo_url', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('configuracion_clinica', 'qr_fijo_datos', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('configuracion_clinica', 'politica_inasistencia', { type: Sequelize.TEXT, allowNull: true });

    // pagos
    await queryInterface.addColumn('pagos', 'metodo_adelanto', {
      type: Sequelize.ENUM('qr_banco', 'qr_fijo'),
      allowNull: true,
    });
    // Los adelantos ya cobrados por QR del banco quedan bajo la política.
    await queryInterface.sequelize.query(
      "UPDATE pagos SET metodo_adelanto = 'qr_banco' WHERE referencia_qr_banco IS NOT NULL"
    );
    await queryInterface.addColumn('pagos', 'comprobante_archivo', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('pagos', 'comprobante_revision', {
      type: Sequelize.ENUM('sin_revisar', 'valido', 'invalido'),
      allowNull: true,
    });
    await queryInterface.addColumn('pagos', 'comprobante_revisado_por_id', {
      type: tipoUsuario,
      allowNull: true,
      references: { model: 'usuarios', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addColumn('pagos', 'comprobante_revisado_en', { type: Sequelize.DATE, allowNull: true });

    // citas
    await queryInterface.addColumn('citas', 'politica_aceptada_en', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('citas', 'justificacion_estado', {
      type: Sequelize.ENUM('aceptada', 'rechazada'),
      allowNull: true,
    });
    await queryInterface.addColumn('citas', 'justificacion_archivo', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('citas', 'justificacion_nota', { type: Sequelize.TEXT, allowNull: true });
    await queryInterface.addColumn('citas', 'justificacion_registrada_en', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('citas', 'reprogramacion_usada', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('citas', 'fecha_original', { type: Sequelize.DATEONLY, allowNull: true });
    await queryInterface.addColumn('citas', 'hora_original', { type: Sequelize.TIME, allowNull: true });
  },

  async down(queryInterface, Sequelize) {
    for (const columna of COLUMNAS_CITAS) {
      await queryInterface.removeColumn('citas', columna);
    }

    const [fks] = await queryInterface.sequelize.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pagos'
         AND COLUMN_NAME = 'comprobante_revisado_por_id' AND REFERENCED_TABLE_NAME IS NOT NULL`
    );
    for (const fk of fks) {
      await queryInterface.removeConstraint('pagos', fk.CONSTRAINT_NAME);
    }
    for (const columna of ['comprobante_revisado_en', 'comprobante_revisado_por_id', 'comprobante_revision', 'comprobante_archivo', 'metodo_adelanto']) {
      await queryInterface.removeColumn('pagos', columna);
    }

    await queryInterface.addColumn('configuracion_clinica', 'cobra_adelanto_online', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.sequelize.query(
      "UPDATE configuracion_clinica SET cobra_adelanto_online = (metodo_pago_online <> 'ninguno')"
    );
    for (const columna of ['politica_inasistencia', 'qr_fijo_datos', 'qr_fijo_url', 'metodo_pago_online']) {
      await queryInterface.removeColumn('configuracion_clinica', columna);
    }
  },
};

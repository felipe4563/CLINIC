// backend/src/migrations/20261014000000-historia-clinica.js
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

const COLUMNAS_PACIENTE = [
  ['sexo', (S) => S.ENUM('F', 'M')],
  ['estado_civil', (S) => S.ENUM('S', 'C', 'D', 'V')],
  ['grupo_sanguineo', (S) => S.STRING(5)],
  ['direccion', (S) => S.STRING(255)],
  ['ocupacion', (S) => S.STRING(120)],
  ['email', (S) => S.STRING(160)],
  ['contacto_emergencia', (S) => S.STRING(160)],
  ['parentesco_emergencia', (S) => S.STRING(60)],
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const tipoPaciente = await tipoIdDe(queryInterface, Sequelize, 'pacientes');
    const tipoProfesional = await tipoIdDe(queryInterface, Sequelize, 'profesionales');
    const tipoUsuario = await tipoIdDe(queryInterface, Sequelize, 'usuarios');

    for (const [columna, tipo] of COLUMNAS_PACIENTE) {
      await queryInterface.addColumn('pacientes', columna, { type: tipo(Sequelize), allowNull: true });
    }

    // Las columnas JSON no llevan DEFAULT: MySQL no lo permite; el modelo lo pone.
    await queryInterface.createTable('historias_clinicas', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      paciente_id: {
        type: tipoPaciente,
        allowNull: false,
        references: { model: 'pacientes', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      fecha: { type: Sequelize.DATEONLY, allowNull: false },
      motivo_consulta: { type: Sequelize.TEXT, allowNull: true },
      datos_clinicos: { type: Sequelize.JSON, allowNull: false },
      datos_esteticos: { type: Sequelize.JSON, allowNull: false },
      analisis_estetico: { type: Sequelize.JSON, allowNull: false },
      diagnostico: { type: Sequelize.TEXT, allowNull: true },
      protocolo: { type: Sequelize.JSON, allowNull: false },
      procedimiento_autorizado: { type: Sequelize.STRING(255), allowNull: true },
      profesional_id: {
        type: tipoProfesional,
        allowNull: true,
        references: { model: 'profesionales', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      documento_firmado: { type: Sequelize.STRING, allowNull: true },
      creado_por_id: {
        type: tipoUsuario,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      actualizado_por_id: {
        type: tipoUsuario,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('historias_clinicas', ['paciente_id', 'fecha']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('historias_clinicas');
    for (const [columna] of [...COLUMNAS_PACIENTE].reverse()) {
      await queryInterface.removeColumn('pacientes', columna);
    }
  },
};

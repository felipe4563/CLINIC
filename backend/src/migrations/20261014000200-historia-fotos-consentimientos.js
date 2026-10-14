'use strict';

// Fotos de la paciente (archivos privados) y consentimientos marcados de cada
// evaluación. JSON sin DEFAULT en la base (MySQL no lo permite): se agregan
// nulos, se rellenan y luego pasan a NOT NULL; el modelo pone [] al crear.
const COLUMNAS = ['fotos', 'consentimientos'];

module.exports = {
  async up(queryInterface, Sequelize) {
    for (const columna of COLUMNAS) {
      await queryInterface.addColumn('historias_clinicas', columna, { type: Sequelize.JSON, allowNull: true });
      await queryInterface.sequelize.query(`UPDATE historias_clinicas SET \`${columna}\` = '[]' WHERE \`${columna}\` IS NULL`);
      await queryInterface.changeColumn('historias_clinicas', columna, { type: Sequelize.JSON, allowNull: false });
    }
  },

  async down(queryInterface) {
    for (const columna of COLUMNAS) await queryInterface.removeColumn('historias_clinicas', columna);
  },
};

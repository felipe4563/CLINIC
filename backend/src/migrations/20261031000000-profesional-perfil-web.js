'use strict';

// Perfil público de cada profesional: lo que la página web muestra en "Nuestro
// equipo" y en /equipo/<slug>. Se carga desde el panel (Catálogo → Profesionales).

// Copia de la regla del modelo: una migración no debe depender del código que cambia.
function slugDeNombre(nombre) {
  return String(nombre || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/^\s*(dra|dr|lic|licda|lcda|lcdo)\.?\s+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || 'profesional';
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('profesionales', 'slug', { type: Sequelize.STRING(120), allowNull: true, after: 'nombre' });
    await queryInterface.addIndex('profesionales', ['slug'], { unique: true, name: 'profesionales_slug_unico' });
    await queryInterface.addColumn('profesionales', 'cargo', { type: Sequelize.STRING, allowNull: true, after: 'registro_profesional' });
    await queryInterface.addColumn('profesionales', 'biografia', { type: Sequelize.TEXT, allowNull: true, after: 'cargo' });
    // Sin DEFAULT: MySQL no lo permite en JSON; el modelo devuelve [] si está vacío.
    await queryInterface.addColumn('profesionales', 'formacion', { type: Sequelize.JSON, allowNull: true, after: 'biografia' });
    await queryInterface.addColumn('profesionales', 'mostrar_en_web', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false, after: 'formacion' });
    await queryInterface.addColumn('profesionales', 'orden_web', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0, after: 'mostrar_en_web' });

    // Cada profesional que ya existe recibe su dirección (misma regla que el modelo).
    const [filas] = await queryInterface.sequelize.query('SELECT id, nombre FROM profesionales ORDER BY id');
    const usados = new Set();
    for (const { id, nombre } of filas) {
      const base = slugDeNombre(nombre);
      let slug = base;
      for (let n = 2; usados.has(slug); n++) slug = `${base}-${n}`;
      usados.add(slug);
      await queryInterface.sequelize.query('UPDATE profesionales SET slug = ? WHERE id = ?', { replacements: [slug, id] });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('profesionales', 'orden_web');
    await queryInterface.removeColumn('profesionales', 'mostrar_en_web');
    await queryInterface.removeColumn('profesionales', 'formacion');
    await queryInterface.removeColumn('profesionales', 'biografia');
    await queryInterface.removeColumn('profesionales', 'cargo');
    await queryInterface.removeIndex('profesionales', 'profesionales_slug_unico');
    await queryInterface.removeColumn('profesionales', 'slug');
  },
};

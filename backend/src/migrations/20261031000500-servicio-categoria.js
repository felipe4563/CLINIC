'use strict';

// Los servicios pasan a tener especialidad y grupo propios. Hasta ahora iban
// escritos al inicio de la descripción ("Medicina Estética · Tratamientos
// Faciales — …"): se pasan a las columnas nuevas y se quitan de la descripción.
const { ESPECIALIDADES } = require('../config/categoriasServicio');

const plano = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function separar(nombre, descripcion) {
  // La consulta de evaluación es de Medicina Estética (así la muestra la web).
  if (plano(nombre) === 'consulta') return { especialidad: 'Medicina Estética', grupo: null, descripcion };
  const d = descripcion || '';
  const corte = d.indexOf('—');
  if (corte < 0) return null;
  const prefijo = plano(d.slice(0, corte));
  for (const e of ESPECIALIDADES) {
    const esp = plano(e.nombre);
    if (prefijo === esp) return { especialidad: e.nombre, grupo: null, descripcion: d.slice(corte + 1).trim() || null };
    if (prefijo.startsWith(`${esp} · `)) {
      const grupo = e.grupos.find((g) => plano(g) === prefijo.slice(esp.length + 3).trim());
      if (grupo) return { especialidad: e.nombre, grupo, descripcion: d.slice(corte + 1).trim() || null };
    }
  }
  return null;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('servicios', 'especialidad', { type: Sequelize.STRING(80), allowNull: true, after: 'descripcion' });
    await queryInterface.addColumn('servicios', 'grupo', { type: Sequelize.STRING(80), allowNull: true, after: 'especialidad' });

    const [servicios] = await queryInterface.sequelize.query('SELECT id, nombre, descripcion FROM servicios');
    for (const s of servicios) {
      const c = separar(s.nombre, s.descripcion);
      if (!c) continue;
      await queryInterface.sequelize.query('UPDATE servicios SET especialidad = ?, grupo = ?, descripcion = ? WHERE id = ?', {
        replacements: [c.especialidad, c.grupo, c.descripcion, s.id],
      });
    }
  },

  async down(queryInterface) {
    // Vuelve a escribir la categoría al inicio de la descripción.
    const [servicios] = await queryInterface.sequelize.query(
      "SELECT id, nombre, descripcion, especialidad, grupo FROM servicios WHERE especialidad IS NOT NULL AND LOWER(nombre) <> 'consulta'",
    );
    for (const s of servicios) {
      const prefijo = s.grupo ? `${s.especialidad} · ${s.grupo}` : s.especialidad;
      await queryInterface.sequelize.query('UPDATE servicios SET descripcion = ? WHERE id = ?', {
        replacements: [s.descripcion ? `${prefijo} — ${s.descripcion}` : prefijo, s.id],
      });
    }
    await queryInterface.removeColumn('servicios', 'grupo');
    await queryInterface.removeColumn('servicios', 'especialidad');
  },
};

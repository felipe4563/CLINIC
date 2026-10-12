// backend/src/migrations/20261014000100-permiso-historia-clinica.js
'use strict';

// Los roles ya existentes no toman PERMISOS_POR_DEFECTO (solo se usa al
// crearlos): se agrega el permiso nuevo a mano a Admin y Profesional.
const PERMISO = 'historia_clinica';

function leer(permisos) {
  if (Array.isArray(permisos)) return permisos;
  try {
    return JSON.parse(permisos || '[]');
  } catch {
    return [];
  }
}

module.exports = {
  async up(queryInterface) {
    const [roles] = await queryInterface.sequelize.query(
      "SELECT id, permisos FROM roles WHERE nombre IN ('Admin', 'Profesional')"
    );
    for (const rol of roles) {
      const permisos = leer(rol.permisos);
      if (permisos.includes(PERMISO)) continue;
      await queryInterface.sequelize.query('UPDATE roles SET permisos = ? WHERE id = ?', {
        replacements: [JSON.stringify([...permisos, PERMISO]), rol.id],
      });
    }
  },

  async down(queryInterface) {
    const [roles] = await queryInterface.sequelize.query('SELECT id, permisos FROM roles');
    for (const rol of roles) {
      const permisos = leer(rol.permisos);
      if (!permisos.includes(PERMISO)) continue;
      await queryInterface.sequelize.query('UPDATE roles SET permisos = ? WHERE id = ?', {
        replacements: [JSON.stringify(permisos.filter((p) => p !== PERMISO)), rol.id],
      });
    }
  },
};

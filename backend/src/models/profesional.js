const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

// "Dra. Maria Noemi Ponce Caisiri" → "maria-noemi-ponce-caisiri": sin título, tildes ni signos.
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

const Profesional = sequelize.define('Profesional', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  // Dirección de su página en la web. Se crea una vez y no cambia al renombrar,
  // para que los enlaces ya compartidos sigan funcionando.
  slug: { type: DataTypes.STRING(120), allowNull: true, unique: true },
  especialidad: { type: DataTypes.STRING, allowNull: true },
  registro_profesional: { type: DataTypes.STRING, allowNull: true },
  cargo: { type: DataTypes.STRING, allowNull: true },
  biografia: { type: DataTypes.TEXT, allowNull: true },
  // [{ titulo, detalle }]. MariaDB devuelve JSON como texto: el getter lo normaliza.
  formacion: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      const raw = this.getDataValue('formacion');
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') {
        try {
          const lista = JSON.parse(raw);
          return Array.isArray(lista) ? lista : [];
        } catch {
          return [];
        }
      }
      return [];
    },
  },
  mostrar_en_web: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  orden_web: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  foto_url: { type: DataTypes.STRING, allowNull: true },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'profesionales', underscored: true });

Profesional.addHook('beforeSave', async (profesional, options) => {
  if (profesional.slug) return;
  const base = slugDeNombre(profesional.nombre);
  let slug = base;
  for (let n = 2; ; n++) {
    const where = { slug };
    if (profesional.id) where.id = { [Op.ne]: profesional.id };
    const ocupado = await Profesional.findOne({ where, attributes: ['id'], transaction: options.transaction });
    if (!ocupado) break;
    slug = `${base}-${n}`;
  }
  profesional.slug = slug;
});

Profesional.slugDeNombre = slugDeNombre;

module.exports = Profesional;

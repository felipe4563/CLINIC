const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConfiguracionClinica = sequelize.define('ConfiguracionClinica', {
  nombre_consultorio: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Clinic NovagED' },
  nit: { type: DataTypes.STRING, allowNull: true },
  direccion: { type: DataTypes.STRING, allowNull: true },
  ciudad: { type: DataTypes.STRING, allowNull: true },
  pais: { type: DataTypes.STRING, allowNull: true, defaultValue: 'Bolivia' },
  telefono: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: true },
  sitio_web: { type: DataTypes.STRING, allowNull: true },
  logo_url: { type: DataTypes.STRING, allowNull: true },
  pie_pdf: { type: DataTypes.TEXT, allowNull: true },
  cobra_adelanto_online: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  bs_por_punto: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 10 },
}, { tableName: 'configuracion_clinica', underscored: true });

async function obtenerConfig() {
  const [config] = await ConfiguracionClinica.findOrCreate({ where: { id: 1 }, defaults: { id: 1 } });
  return config;
}

module.exports = ConfiguracionClinica;
module.exports.obtenerConfig = obtenerConfig;

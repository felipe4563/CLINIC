const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// MariaDB (XAMPP) devuelve las columnas JSON como texto; MySQL 8 como objeto.
// El getter las normaliza para que el resto del código siempre vea objetos.
function jsonCampo(nombre, porDefecto) {
  return {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: porDefecto,
    get() {
      const raw = this.getDataValue(nombre);
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch {
          return porDefecto;
        }
      }
      return raw ?? porDefecto;
    },
  };
}

const HistoriaClinica = sequelize.define('HistoriaClinica', {
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  motivo_consulta: { type: DataTypes.TEXT, allowNull: true },
  datos_clinicos: jsonCampo('datos_clinicos', {}),
  datos_esteticos: jsonCampo('datos_esteticos', {}),
  analisis_estetico: jsonCampo('analisis_estetico', {}),
  diagnostico: { type: DataTypes.TEXT, allowNull: true },
  protocolo: jsonCampo('protocolo', []),
  fotos: jsonCampo('fotos', []),
  consentimientos: jsonCampo('consentimientos', []),
  procedimiento_autorizado: { type: DataTypes.STRING(255), allowNull: true },
  documento_firmado: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'historias_clinicas', underscored: true });

module.exports = HistoriaClinica;

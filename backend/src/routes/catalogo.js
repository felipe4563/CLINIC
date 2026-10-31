const express = require('express');
const { Op } = require('sequelize');
const db = require('../models');
const { TEXTO_POR_DEFECTO } = require('../services/politicaInasistencia');

const router = express.Router();

// Lo que la web puede ver de un profesional (nunca su usuario ni datos internos).
const CAMPOS_PUBLICOS = ['id', 'nombre', 'slug', 'especialidad', 'cargo', 'foto_url'];
const CAMPOS_PERFIL = [...CAMPOS_PUBLICOS, 'registro_profesional', 'biografia', 'formacion', 'orden_web'];

router.get('/servicios', async (req, res) => {
  const servicios = await db.Servicio.findAll({ where: { activo: true } });
  res.json(servicios);
});

router.get('/profesionales', async (req, res) => {
  const { servicioId } = req.query;
  const where = { activo: true };
  const include = [];
  if (servicioId) {
    include.push({ model: db.Servicio, where: { id: servicioId }, through: { attributes: [] } });
  }
  const profesionales = await db.Profesional.findAll({ where, include, attributes: CAMPOS_PUBLICOS });
  res.json(profesionales);
});

// "Nuestro equipo": solo quien está marcado para la web y tiene biografía cargada.
function whereEquipo() {
  return {
    activo: true,
    mostrar_en_web: true,
    biografia: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
  };
}

const INCLUDE_SERVICIOS = {
  model: db.Servicio,
  attributes: ['id', 'nombre'],
  where: { activo: true },
  required: false,
  through: { attributes: [] },
};

router.get('/equipo', async (req, res) => {
  const equipo = await db.Profesional.findAll({
    where: whereEquipo(),
    attributes: CAMPOS_PERFIL,
    include: [INCLUDE_SERVICIOS],
    order: [['orden_web', 'ASC'], ['nombre', 'ASC']],
  });
  res.json(equipo);
});

router.get('/equipo/:slug', async (req, res) => {
  const profesional = await db.Profesional.findOne({
    where: { ...whereEquipo(), slug: req.params.slug },
    attributes: CAMPOS_PERFIL,
    include: [INCLUDE_SERVICIOS],
  });
  if (!profesional) return res.status(404).json({ error: 'Profesional no encontrado' });
  res.json(profesional);
});

router.get('/configuracion-publica', async (req, res) => {
  const config = await db.ConfiguracionClinica.obtenerConfig();
  const { nombre_consultorio, direccion, ciudad, pais, telefono, email, sitio_web, logo_url, metodo_pago_online, qr_fijo_url, qr_fijo_datos } = config;
  const politica = (config.politica_inasistencia || '').trim() || TEXTO_POR_DEFECTO;
  res.json({
    nombre_consultorio, direccion, ciudad, pais, telefono, email, sitio_web, logo_url,
    metodo_pago_online, qr_fijo_url, qr_fijo_datos, politica_inasistencia: politica,
  });
});

module.exports = router;

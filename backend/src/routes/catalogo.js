const express = require('express');
const db = require('../models');
const { TEXTO_POR_DEFECTO } = require('../services/politicaInasistencia');

const router = express.Router();

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
  const profesionales = await db.Profesional.findAll({ where, include });
  res.json(profesionales);
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

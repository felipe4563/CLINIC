const express = require('express');
const db = require('../models');

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

module.exports = router;

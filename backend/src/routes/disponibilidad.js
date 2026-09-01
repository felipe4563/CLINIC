const express = require('express');
const { getSlotsDisponibles } = require('../services/disponibilidad');

const router = express.Router();

router.get('/disponibilidad', async (req, res) => {
  const { profesionalId, servicioId, fecha } = req.query;
  if (!profesionalId || !servicioId || !fecha) {
    return res.status(400).json({ error: 'profesionalId, servicioId y fecha son requeridos' });
  }
  const slots = await getSlotsDisponibles({
    profesionalId: Number(profesionalId), servicioId: Number(servicioId), fecha,
  });
  res.json(slots);
});

module.exports = router;

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

// Días del mes con al menos un horario libre, para pintar el calendario.
router.get('/disponibilidad/mes', async (req, res) => {
  const { profesionalId, servicioId, mes } = req.query;
  if (!profesionalId || !servicioId || !/^\d{4}-\d{2}$/.test(mes || '')) {
    return res.status(400).json({ error: 'profesionalId, servicioId y mes (AAAA-MM) son requeridos' });
  }
  const [anio, numMes] = mes.split('-').map(Number);
  const dias = new Date(anio, numMes, 0).getDate();
  const resultado = [];
  for (let d = 1; d <= dias; d++) {
    const fecha = `${mes}-${String(d).padStart(2, '0')}`;
    const slots = await getSlotsDisponibles({ profesionalId: Number(profesionalId), servicioId: Number(servicioId), fecha });
    if (slots.length) resultado.push({ fecha, libres: slots.length });
  }
  res.json(resultado);
});

module.exports = router;

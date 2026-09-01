require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const catalogoRoutes = require('./routes/catalogo');
const disponibilidadRoutes = require('./routes/disponibilidad');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/', catalogoRoutes);
app.use('/', disponibilidadRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

module.exports = app;

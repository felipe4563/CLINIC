const express = require('express');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { generarQR, consultarEstadoQR } = require('../services/bancoEconomico');

const router = express.Router();
const onlyVentas = requirePermiso('ventas');

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

async function registrarIngresoCaja(venta, usuarioId) {
  await db.MovimientoCaja.create({
    tipo: 'ingreso',
    concepto: `Venta #${venta.id}${venta.cliente_nombre ? ' - ' + venta.cliente_nombre : ''}`,
    monto: venta.total,
    fecha: venta.fecha,
    usuario_id: usuarioId,
    venta_id: venta.id,
  });
}

router.get('/staff/ventas', onlyVentas, async (req, res) => {
  const fecha = req.query.fecha || hoyISO();
  const ventas = await db.Venta.findAll({
    where: { fecha },
    include: [db.Usuario, db.Paciente, { model: db.VentaItem, include: [db.Producto] }],
    order: [['id', 'DESC']],
  });

  const totalDia = ventas.filter((v) => v.estado === 'pagado').reduce((acc, v) => acc + Number(v.total), 0);
  res.json({ fecha, ventas, totalDia });
});

router.post('/staff/ventas', onlyVentas, async (req, res) => {
  const { items, metodoPago, clienteNombre, pacienteId } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items es requerido y debe tener al menos un producto' });
  }
  if (!['efectivo', 'qr'].includes(metodoPago)) {
    return res.status(400).json({ error: 'metodoPago debe ser efectivo o qr' });
  }

  const productos = await db.Producto.findAll({ where: { id: items.map((i) => i.productoId) } });
  const porId = Object.fromEntries(productos.map((p) => [p.id, p]));

  for (const item of items) {
    const producto = porId[item.productoId];
    if (!producto) return res.status(400).json({ error: `Producto ${item.productoId} no encontrado` });
    if (!item.cantidad || item.cantidad <= 0) return res.status(400).json({ error: 'cantidad invalida' });
    if (producto.stock < item.cantidad) {
      return res.status(409).json({ error: `Stock insuficiente de "${producto.nombre}" (disponible: ${producto.stock})` });
    }
  }

  const total = items.reduce((acc, item) => acc + Number(porId[item.productoId].precio_venta) * item.cantidad, 0);

  const venta = await db.Venta.create({
    fecha: hoyISO(),
    total,
    metodo_pago: metodoPago,
    estado: metodoPago === 'efectivo' ? 'pagado' : 'pendiente',
    cliente_nombre: clienteNombre || null,
    paciente_id: pacienteId || null,
    usuario_id: req.usuarioId,
  });

  for (const item of items) {
    const producto = porId[item.productoId];
    await db.VentaItem.create({
      venta_id: venta.id,
      producto_id: producto.id,
      cantidad: item.cantidad,
      precio_unitario: producto.precio_venta,
      subtotal: Number(producto.precio_venta) * item.cantidad,
    });
    producto.stock -= item.cantidad;
    await producto.save();
  }

  if (metodoPago === 'efectivo') {
    await registrarIngresoCaja(venta, req.usuarioId);
    const ventaCompleta = await db.Venta.findByPk(venta.id, { include: [{ model: db.VentaItem, include: [db.Producto] }] });
    return res.status(201).json({ venta: ventaCompleta });
  }

  const { qrId, qrImageBase64 } = await generarQR({
    monto: total,
    transactionId: `VENTA-${venta.id}-${Date.now()}`,
    descripcion: `Venta #${venta.id}`,
  });
  venta.referencia_qr = qrId;
  await venta.save();

  res.status(201).json({ venta, qrImageBase64, referencia: qrId });
});

router.get('/staff/ventas/:id/estado', onlyVentas, async (req, res) => {
  const venta = await db.Venta.findByPk(req.params.id);
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });

  if (venta.estado === 'pagado') return res.json({ pagado: true });
  if (!venta.referencia_qr) return res.json({ pagado: false });

  const { pagado } = await consultarEstadoQR(venta.referencia_qr);
  if (pagado) {
    venta.estado = 'pagado';
    await venta.save();
  }

  res.json({ pagado });
});

router.delete('/staff/ventas/:id', onlyVentas, async (req, res) => {
  const venta = await db.Venta.findByPk(req.params.id, { include: [db.VentaItem] });
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
  if (venta.estado === 'pagado') {
    return res.status(400).json({ error: 'No se puede cancelar una venta ya pagada' });
  }

  for (const item of venta.VentaItems) {
    const producto = await db.Producto.findByPk(item.producto_id);
    if (producto) {
      producto.stock += item.cantidad;
      await producto.save();
    }
  }

  await venta.destroy();
  res.status(204).end();
});

module.exports = router;

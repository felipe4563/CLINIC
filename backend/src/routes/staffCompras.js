const express = require('express');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');

const router = express.Router();
const onlyCompras = requirePermiso('compras');

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

async function registrarEgresoCaja(compra, usuarioId) {
  const proveedor = compra.Proveedor ? ` - ${compra.Proveedor.nombre}` : '';
  await db.MovimientoCaja.create({
    tipo: 'egreso',
    concepto: `Compra #${compra.id}${proveedor}`,
    monto: compra.total,
    fecha: compra.fecha,
    usuario_id: usuarioId,
    compra_id: compra.id,
  });
}

// --- Proveedores ---

router.get('/staff/proveedores', onlyCompras, async (req, res) => {
  const proveedores = await db.Proveedor.findAll({ order: [['nombre', 'ASC']] });
  res.json(proveedores);
});

router.post('/staff/proveedores', onlyCompras, async (req, res) => {
  const { nombre, contacto, telefono, notas } = req.body;
  if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'nombre es requerido' });
  const proveedor = await db.Proveedor.create({
    nombre: nombre.trim(),
    contacto: contacto || null,
    telefono: telefono || null,
    notas: notas || null,
  });
  res.status(201).json(proveedor);
});

router.delete('/staff/proveedores/:id', onlyCompras, async (req, res) => {
  const proveedor = await db.Proveedor.findByPk(req.params.id);
  if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
  const enUso = await db.Compra.count({ where: { proveedor_id: proveedor.id } });
  if (enUso > 0) return res.status(409).json({ error: 'No se puede eliminar: hay compras registradas con este proveedor' });
  await proveedor.destroy();
  res.status(204).end();
});

// --- Compras ---

router.get('/staff/compras', onlyCompras, async (req, res) => {
  const fecha = req.query.fecha || hoyISO();
  const compras = await db.Compra.findAll({
    where: { fecha },
    include: [db.Usuario, db.Proveedor, { model: db.CompraItem, include: [db.Producto] }],
    order: [['id', 'DESC']],
  });

  const totalDia = compras.reduce((acc, c) => acc + Number(c.total), 0);
  res.json({ fecha, compras, totalDia });
});

router.post('/staff/compras', onlyCompras, async (req, res) => {
  const { items, proveedorId, nota } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items es requerido y debe tener al menos un producto' });
  }

  const productos = await db.Producto.findAll({ where: { id: items.map((i) => i.productoId) } });
  const porId = Object.fromEntries(productos.map((p) => [p.id, p]));

  for (const item of items) {
    const producto = porId[item.productoId];
    if (!producto) return res.status(400).json({ error: `Producto ${item.productoId} no encontrado` });
    if (!item.cantidad || item.cantidad <= 0) return res.status(400).json({ error: 'cantidad invalida' });
    if (item.costoUnitario === undefined || item.costoUnitario === null || Number(item.costoUnitario) < 0) {
      return res.status(400).json({ error: 'costoUnitario invalido' });
    }
  }

  const total = items.reduce((acc, item) => acc + Number(item.costoUnitario) * item.cantidad, 0);

  const compra = await db.Compra.create({
    fecha: hoyISO(),
    total,
    nota: nota || null,
    proveedor_id: proveedorId || null,
    usuario_id: req.usuarioId,
  });

  for (const item of items) {
    const producto = porId[item.productoId];
    await db.CompraItem.create({
      compra_id: compra.id,
      producto_id: producto.id,
      cantidad: item.cantidad,
      costo_unitario: item.costoUnitario,
      subtotal: Number(item.costoUnitario) * item.cantidad,
    });
    producto.stock += item.cantidad;
    producto.precio_costo = item.costoUnitario;
    await producto.save();
  }

  const compraCompleta = await db.Compra.findByPk(compra.id, {
    include: [db.Usuario, db.Proveedor, { model: db.CompraItem, include: [db.Producto] }],
  });
  await registrarEgresoCaja(compraCompleta, req.usuarioId);

  res.status(201).json({ compra: compraCompleta });
});

router.delete('/staff/compras/:id', onlyCompras, async (req, res) => {
  const compra = await db.Compra.findByPk(req.params.id, { include: [db.CompraItem] });
  if (!compra) return res.status(404).json({ error: 'Compra no encontrada' });

  for (const item of compra.CompraItems) {
    const producto = await db.Producto.findByPk(item.producto_id);
    if (producto) {
      if (producto.stock < item.cantidad) {
        return res.status(409).json({
          error: `No se puede anular: el stock de "${producto.nombre}" ya bajó de lo comprado (posiblemente por ventas posteriores)`,
        });
      }
      producto.stock -= item.cantidad;
      await producto.save();
    }
  }

  await db.MovimientoCaja.destroy({ where: { compra_id: compra.id } });
  await compra.destroy();
  res.status(204).end();
});

module.exports = router;

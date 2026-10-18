const express = require('express');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { generarQR, consultarEstadoQR } = require('../services/bancoEconomico');
const { otorgarPuntosPorGasto } = require('../services/fidelizacion');

const router = express.Router();
const onlyVentas = requirePermiso('ventas');

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

// --- Productos por acápite (pedido de la doctora: solo qué producto y cuántos hay) ---

const ACAPITES = ['ventas', 'activos', 'mantenimiento'];

class ErrorDato extends Error {}

function datosProducto(body, { parcial = false } = {}) {
  const d = {};
  if (body.nombre !== undefined || !parcial) {
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    if (!nombre) throw new ErrorDato('nombre es requerido');
    if (nombre.length > 255) throw new ErrorDato('nombre admite hasta 255 caracteres');
    d.nombre = nombre;
  }
  if (body.acapite !== undefined || !parcial) {
    if (!ACAPITES.includes(body.acapite)) throw new ErrorDato('acapite debe ser ventas, activos o mantenimiento');
    d.acapite = body.acapite;
  }
  if (body.codigo !== undefined) {
    const codigo = typeof body.codigo === 'string' ? body.codigo.trim() : '';
    if (codigo.length > 255) throw new ErrorDato('codigo admite hasta 255 caracteres');
    d.codigo = codigo || null;
  }
  if (body.precio_venta !== undefined && body.precio_venta !== null && body.precio_venta !== '') {
    const precio = Number(body.precio_venta);
    if (!Number.isFinite(precio) || precio < 0 || precio > 1000000) throw new ErrorDato('precio_venta inválido');
    d.precio_venta = Math.round(precio * 100) / 100;
  } else if (!parcial) d.precio_venta = 0;
  if (!parcial) {
    const stock = body.stock === undefined || body.stock === '' ? 0 : Number(body.stock);
    if (!Number.isInteger(stock) || stock < 0 || stock > 1000000) throw new ErrorDato('cantidad inválida');
    d.stock = stock;
  }
  return d;
}

const conManejo = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (err instanceof ErrorDato) return res.status(400).json({ error: err.message });
    throw err;
  }
};

const ATRIBUTOS_PRODUCTO = ['id', 'nombre', 'codigo', 'acapite', 'stock', 'stock_minimo', 'precio_venta', 'imagen_url', 'activo'];

router.get('/staff/ventas/productos', onlyVentas, async (req, res) => {
  const productos = await db.Producto.findAll({ attributes: ATRIBUTOS_PRODUCTO, include: [{ model: db.Marca, attributes: ['nombre'] }], order: [['nombre', 'ASC']] });
  res.json(productos);
});

router.post('/staff/ventas/productos', onlyVentas, conManejo(async (req, res) => {
  const producto = await db.Producto.create({ ...datosProducto(req.body), unidad: 'unidad' });
  res.status(201).json(producto);
}));

router.patch('/staff/ventas/productos/:id', onlyVentas, conManejo(async (req, res) => {
  const producto = await db.Producto.findByPk(req.params.id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  await producto.update(datosProducto(req.body, { parcial: true }));
  res.json(producto);
}));

// Ingreso (llegó mercadería) o uso (se gastó en la clínica). El ingreso queda
// registrado como compra sin costo, para saber cuándo y cuánto entró.
router.post('/staff/ventas/productos/:id/movimiento', onlyVentas, async (req, res) => {
  const { tipo } = req.body;
  const cantidad = Number(req.body.cantidad);
  if (!['ingreso', 'uso'].includes(tipo)) return res.status(400).json({ error: 'tipo debe ser ingreso o uso' });
  if (!Number.isInteger(cantidad) || cantidad <= 0 || cantidad > 100000) return res.status(400).json({ error: 'cantidad inválida' });
  const resultado = await db.sequelize.transaction(async (transaction) => {
    const producto = await db.Producto.findByPk(req.params.id, { lock: transaction.LOCK.UPDATE, transaction });
    if (!producto) return { status: 404, error: 'Producto no encontrado' };
    if (tipo === 'uso') {
      if (producto.stock < cantidad) return { status: 409, error: `Solo hay ${producto.stock} de "${producto.nombre}"` };
      producto.stock -= cantidad;
    } else {
      const compra = await db.Compra.create({ fecha: hoyISO(), total: 0, nota: 'Ingreso', usuario_id: req.usuarioId }, { transaction });
      await db.CompraItem.create({ compra_id: compra.id, producto_id: producto.id, cantidad, costo_unitario: 0, subtotal: 0 }, { transaction });
      producto.stock += cantidad;
    }
    await producto.save({ transaction });
    return { producto };
  });
  if (resultado.error) return res.status(resultado.status).json({ error: resultado.error });
  res.json(resultado.producto);
});

// Solo se borra un producto sin ventas ni ingresos; si los tiene, se desactiva.
router.delete('/staff/ventas/productos/:id', onlyVentas, async (req, res) => {
  const producto = await db.Producto.findByPk(req.params.id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  const usado = (await db.VentaItem.count({ where: { producto_id: producto.id } })) + (await db.CompraItem.count({ where: { producto_id: producto.id } }));
  if (usado) {
    producto.activo = false;
    await producto.save();
    return res.json({ desactivado: true });
  }
  await db.ServicioProducto.destroy({ where: { producto_id: producto.id } });
  await producto.destroy();
  res.status(204).end();
});

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
    if (producto.acapite !== 'ventas' || !producto.activo) return res.status(400).json({ error: `"${producto.nombre}" no está a la venta` });
    if (!(Number(producto.precio_venta) > 0)) return res.status(400).json({ error: `"${producto.nombre}" no tiene precio` });
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
    if (venta.paciente_id) {
      await otorgarPuntosPorGasto({
        pacienteId: venta.paciente_id,
        monto: venta.total,
        motivo: `Venta #${venta.id}`,
        ventaId: venta.id,
      });
    }
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
  // Solo la consulta que pasa la venta de pendiente a pagado registra la caja
  // y los puntos (el panel consulta cada pocos segundos y pueden cruzarse).
  const [cambiadas] = pagado ? await db.Venta.update({ estado: 'pagado' }, { where: { id: venta.id, estado: 'pendiente' } }) : [0];
  if (cambiadas === 1) {
    venta.estado = 'pagado';
    await registrarIngresoCaja(venta, venta.usuario_id);
    if (venta.paciente_id) {
      await otorgarPuntosPorGasto({
        pacienteId: venta.paciente_id,
        monto: venta.total,
        motivo: `Venta #${venta.id}`,
        ventaId: venta.id,
      });
    }
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

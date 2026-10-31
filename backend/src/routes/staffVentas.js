const express = require('express');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { generarQR, consultarEstadoQR } = require('../services/bancoEconomico');
const { otorgarPuntosPorGasto } = require('../services/fidelizacion');

const router = express.Router();
const onlyVentas = requirePermiso('ventas');
// Los productos (las 3 cajas) se manejan desde Inventario y se venden desde Ventas.
const productosPermiso = requirePermiso(['inventario', 'ventas']);

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

// Pasa la venta de pendiente a pagado una sola vez (el panel consulta cada pocos
// segundos y las consultas pueden cruzarse): solo esa registra la caja y los puntos.
async function marcarPagada(venta) {
  const [cambiadas] = await db.Venta.update({ estado: 'pagado' }, { where: { id: venta.id, estado: 'pendiente' } });
  if (cambiadas !== 1) return;
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

async function anularVenta(venta) {
  const items = await db.VentaItem.findAll({ where: { venta_id: venta.id } });
  for (const item of items) {
    const producto = await db.Producto.findByPk(item.producto_id);
    if (producto) {
      producto.stock += item.cantidad;
      await producto.save();
    }
  }
  await db.VentaItem.destroy({ where: { venta_id: venta.id } });
  await venta.destroy();
}

// El QR del cobro sigue la configuración: QR del banco (se confirma solo) o el QR
// fijo de la clínica (el personal confirma que llegó el pago).
function modoQR(config) {
  if (config.metodo_pago_online === 'qr_banco') return 'banco';
  if (config.qr_fijo_url) return 'fijo';
  return null;
}

// --- Productos de las 3 cajas del inventario: insumos, activos y ventas ---

const ACAPITES = ['insumos', 'activos', 'ventas'];

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
    if (!ACAPITES.includes(body.acapite)) throw new ErrorDato('acapite debe ser insumos, activos o ventas');
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
  // Desde cuántos se avisa que se está acabando.
  if (body.stock_minimo !== undefined) {
    const minimo = body.stock_minimo === null || body.stock_minimo === '' ? 0 : Number(body.stock_minimo);
    if (!Number.isInteger(minimo) || minimo < 0 || minimo > 1000000) throw new ErrorDato('mínimo inválido');
    d.stock_minimo = minimo;
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

router.get('/staff/ventas/productos', productosPermiso, async (req, res) => {
  const productos = await db.Producto.findAll({ attributes: ATRIBUTOS_PRODUCTO, include: [{ model: db.Marca, attributes: ['nombre'] }], order: [['nombre', 'ASC']] });
  res.json(productos);
});

router.post('/staff/ventas/productos', productosPermiso, conManejo(async (req, res) => {
  const producto = await db.Producto.create({ ...datosProducto(req.body), unidad: 'unidad' });
  res.status(201).json(producto);
}));

router.patch('/staff/ventas/productos/:id', productosPermiso, conManejo(async (req, res) => {
  const producto = await db.Producto.findByPk(req.params.id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  await producto.update(datosProducto(req.body, { parcial: true }));
  res.json(producto);
}));

// Ingreso (llegó mercadería) o uso (se gastó en la clínica). El ingreso queda
// registrado como compra sin costo, para saber cuándo y cuánto entró.
router.post('/staff/ventas/productos/:id/movimiento', productosPermiso, async (req, res) => {
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
      await db.MovimientoStock.create({ producto_id: producto.id, tipo: 'uso', cantidad, usuario_id: req.usuarioId, fecha: hoyISO() }, { transaction });
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

// Historial de un producto: lo que llegó (compras e ingresos), lo vendido, lo usado
// a mano y lo que descontaron los tratamientos; lo más reciente primero.
router.get('/staff/ventas/productos/:id/historial', productosPermiso, async (req, res) => {
  const producto = await db.Producto.findByPk(req.params.id, { attributes: ATRIBUTOS_PRODUCTO });
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

  const compras = await db.CompraItem.findAll({
    where: { producto_id: producto.id },
    include: [{ model: db.Compra, attributes: ['id', 'fecha', 'nota', 'createdAt'], include: [{ model: db.Proveedor, attributes: ['nombre'] }, { model: db.Usuario, attributes: ['nombre'] }] }],
  });
  // Desde la venta: Sequelize nombra "Ventum" a la venta vista desde su ítem.
  const ventas = await db.Venta.findAll({
    where: { estado: 'pagado' },
    attributes: ['id', 'fecha', 'cliente_nombre', 'createdAt'],
    include: [
      { model: db.VentaItem, where: { producto_id: producto.id }, attributes: ['cantidad'] },
      { model: db.Paciente, attributes: ['nombre_completo'] },
      { model: db.Usuario, attributes: ['nombre'] },
    ],
  });
  const usos = await db.MovimientoStock.findAll({
    where: { producto_id: producto.id },
    include: [
      { model: db.Cita, as: 'Cita', attributes: ['id', 'fecha'], include: [{ model: db.Paciente, attributes: ['nombre_completo'] }, { model: db.Servicio, attributes: ['nombre'] }] },
      { model: db.Usuario, attributes: ['nombre'] },
    ],
  });

  const movimientos = [
    ...compras.map((c) => {
      const esIngreso = !c.Compra.Proveedor && c.Compra.nota === 'Ingreso';
      return {
        tipo: esIngreso ? 'ingreso' : 'compra',
        cantidad: c.cantidad,
        fecha: c.Compra.fecha,
        momento: c.Compra.createdAt,
        detalle: esIngreso ? 'Llegaron' : `Compra${c.Compra.Proveedor ? ` a ${c.Compra.Proveedor.nombre}` : ''}${c.lote ? ` · lote ${c.lote}` : ''}`,
        usuario: c.Compra.Usuario?.nombre || null,
      };
    }),
    ...ventas.map((v) => ({
      tipo: 'venta',
      cantidad: -v.VentaItems.reduce((acc, i) => acc + i.cantidad, 0),
      fecha: v.fecha,
      momento: v.createdAt,
      detalle: `Venta #${v.id} · ${v.Paciente?.nombre_completo || v.cliente_nombre || 'Cliente mostrador'}`,
      usuario: v.Usuario?.nombre || null,
    })),
    ...usos.map((u) => ({
      tipo: u.tipo,
      cantidad: u.tipo === 'cita_revertida' ? u.cantidad : -u.cantidad,
      fecha: u.fecha,
      momento: u.createdAt,
      detalle:
        u.tipo === 'uso'
          ? 'Se usaron'
          : `${u.tipo === 'cita' ? 'Tratamiento' : 'Devuelto'}${u.Cita ? `: ${u.Cita.Servicio?.nombre || 'cita'} · ${u.Cita.Paciente?.nombre_completo || ''}` : ''}${u.nota ? ` · ${u.nota}` : ''}`,
      usuario: u.Usuario?.nombre || null,
    })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha) || new Date(b.momento) - new Date(a.momento));

  res.json({ producto, movimientos: movimientos.slice(0, 300) });
});

// Solo se borra un producto sin ventas ni ingresos; si los tiene, se desactiva.
router.delete('/staff/ventas/productos/:id', productosPermiso, async (req, res) => {
  const producto = await db.Producto.findByPk(req.params.id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  const usado = (await db.VentaItem.count({ where: { producto_id: producto.id } }))
    + (await db.CompraItem.count({ where: { producto_id: producto.id } }))
    + (await db.MovimientoStock.count({ where: { producto_id: producto.id } }));
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
  // En Ventas el descuento es solo en %, sobre toda la venta.
  const descuentoPorcentaje = req.body.descuentoPorcentaje === undefined || req.body.descuentoPorcentaje === '' ? 0 : Number(req.body.descuentoPorcentaje);
  if (!Number.isFinite(descuentoPorcentaje) || descuentoPorcentaje < 0 || descuentoPorcentaje > 100) {
    return res.status(400).json({ error: 'El descuento debe ser un porcentaje entre 0 y 100' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items es requerido y debe tener al menos un producto' });
  }
  if (!['efectivo', 'qr'].includes(metodoPago)) {
    return res.status(400).json({ error: 'metodoPago debe ser efectivo o qr' });
  }

  const config = await db.ConfiguracionClinica.obtenerConfig();
  const modo = metodoPago === 'qr' ? modoQR(config) : null;
  if (metodoPago === 'qr' && !modo) {
    return res.status(400).json({ error: 'No hay un QR configurado. Sube el QR de la clínica en Configuración o cobra en efectivo.' });
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

  const subtotal = items.reduce((acc, item) => acc + Number(porId[item.productoId].precio_venta) * item.cantidad, 0);
  const porcentaje = Math.round(descuentoPorcentaje * 100) / 100;
  const total = Math.round((subtotal - (subtotal * porcentaje) / 100) * 100) / 100;
  if (metodoPago === 'qr' && !(total > 0)) {
    return res.status(400).json({ error: 'Con el 100% de descuento no hay nada que cobrar con QR' });
  }

  const venta = await db.Venta.create({
    fecha: hoyISO(),
    subtotal,
    descuento_porcentaje: porcentaje,
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

  if (modo === 'fijo') {
    return res.status(201).json({ venta, modo, qrFijo: { url: config.qr_fijo_url, datos: config.qr_fijo_datos } });
  }

  let qr;
  try {
    qr = await generarQR({
      monto: total,
      transactionId: `VENTA-${venta.id}-${Date.now()}`,
      descripcion: `Venta #${venta.id}`,
    });
  } catch (err) {
    // Sin QR no hay cobro: se devuelve el stock y la venta no queda colgada.
    console.error('No se pudo generar el QR de la venta', venta.id, err.message);
    await anularVenta(venta);
    return res.status(502).json({ error: 'El banco no generó el QR. Intenta de nuevo o cobra en efectivo.' });
  }
  venta.referencia_qr = qr.qrId;
  await venta.save();

  res.status(201).json({ venta, modo, qrImageBase64: qr.qrImageBase64, referencia: qr.qrId });
});

router.get('/staff/ventas/:id/estado', onlyVentas, async (req, res) => {
  const venta = await db.Venta.findByPk(req.params.id);
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });

  if (venta.estado === 'pagado') return res.json({ pagado: true });
  if (!venta.referencia_qr) return res.json({ pagado: false });

  const { pagado } = await consultarEstadoQR(venta.referencia_qr);
  if (pagado) await marcarPagada(venta);

  res.json({ pagado });
});

// Datos del comprobante (ticket de 80 mm): la venta cobrada y los datos de la clínica.
router.get('/staff/ventas/:id/comprobante', onlyVentas, async (req, res) => {
  const venta = await db.Venta.findByPk(req.params.id, {
    include: [
      { model: db.Usuario, attributes: ['nombre'] },
      { model: db.Paciente, attributes: ['nombre_completo', 'codigo_paciente'] },
      { model: db.VentaItem, include: [{ model: db.Producto, attributes: ['nombre', 'codigo'] }] },
    ],
  });
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
  if (venta.estado !== 'pagado') return res.status(409).json({ error: 'La venta todavía no está pagada' });

  const config = await db.ConfiguracionClinica.obtenerConfig();
  const { nombre_consultorio, nit, direccion, ciudad, telefono, logo_url, pie_pdf } = config;
  res.json({ venta, clinica: { nombre_consultorio, nit, direccion, ciudad, telefono, logo_url, pie: pie_pdf } });
});

// Con el QR fijo nadie avisa del pago: el personal lo ve en su celular y lo confirma.
router.post('/staff/ventas/:id/confirmar-qr', onlyVentas, async (req, res) => {
  const venta = await db.Venta.findByPk(req.params.id);
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
  if (venta.metodo_pago !== 'qr' || venta.referencia_qr) {
    return res.status(400).json({ error: 'Esta venta se confirma sola con el banco' });
  }
  await marcarPagada(venta);
  res.json({ pagado: true });
});

router.delete('/staff/ventas/:id', onlyVentas, async (req, res) => {
  const venta = await db.Venta.findByPk(req.params.id, { include: [db.VentaItem] });
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
  if (venta.estado === 'pagado') {
    return res.status(400).json({ error: 'No se puede cancelar una venta ya pagada' });
  }

  await anularVenta(venta);
  res.status(204).end();
});

module.exports = router;

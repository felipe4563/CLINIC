const db = require('../models');

// Cada tratamiento dice qué productos usa y cuánto por sesión (servicio_producto).
// Al completar la cita se descuentan del inventario; si la cita deja de estar
// completada, se devuelven. Todo queda en movimientos_stock para el historial.

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Lo que la cita tiene descontado ahora (descontado menos devuelto), por producto.
async function netoPorProducto(citaId, transaction) {
  const movimientos = await db.MovimientoStock.findAll({ where: { cita_id: citaId }, transaction });
  const neto = new Map();
  for (const m of movimientos) {
    const signo = m.tipo === 'cita' ? 1 : m.tipo === 'cita_revertida' ? -1 : 0;
    neto.set(m.producto_id, (neto.get(m.producto_id) || 0) + signo * m.cantidad);
  }
  return neto;
}

// La paciente ya fue atendida: si falta stock se descuenta lo que hay (no queda
// en negativo) y se anota cuánto faltó, para que se vea en el historial.
async function descontarPorCita(cita, usuarioId) {
  return db.sequelize.transaction(async (transaction) => {
    const neto = await netoPorProducto(cita.id, transaction);
    if ([...neto.values()].some((n) => n > 0)) return []; // ya estaba descontada

    const usos = await db.ServicioProducto.findAll({ where: { servicio_id: cita.servicio_id }, transaction });
    const faltantes = [];
    for (const uso of usos) {
      const producto = await db.Producto.findByPk(uso.producto_id, { lock: transaction.LOCK.UPDATE, transaction });
      if (!producto) continue;
      const descontado = Math.min(producto.stock, uso.cantidad);
      const falta = uso.cantidad - descontado;
      producto.stock -= descontado;
      await producto.save({ transaction });
      await db.MovimientoStock.create({
        producto_id: producto.id,
        tipo: 'cita',
        cantidad: descontado,
        cita_id: cita.id,
        usuario_id: usuarioId || null,
        nota: falta > 0 ? `Faltaron ${falta} (no había en el inventario)` : null,
        fecha: hoyISO(),
      }, { transaction });
      if (falta > 0) faltantes.push({ producto: producto.nombre, falta });
    }
    return faltantes;
  });
}

async function revertirPorCita(cita, usuarioId) {
  await db.sequelize.transaction(async (transaction) => {
    const neto = await netoPorProducto(cita.id, transaction);
    for (const [productoId, cantidad] of neto) {
      if (cantidad <= 0) continue;
      const producto = await db.Producto.findByPk(productoId, { lock: transaction.LOCK.UPDATE, transaction });
      if (producto) {
        producto.stock += cantidad;
        await producto.save({ transaction });
      }
      await db.MovimientoStock.create({
        producto_id: productoId,
        tipo: 'cita_revertida',
        cantidad,
        cita_id: cita.id,
        usuario_id: usuarioId || null,
        nota: 'La cita dejó de estar completada',
        fecha: hoyISO(),
      }, { transaction });
    }
  });
}

module.exports = { descontarPorCita, revertirPorCita };

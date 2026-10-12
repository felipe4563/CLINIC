const { Op } = require('sequelize');
const db = require('../models');

// Tarjeta de sellos: cada cita completada de un servicio con cartilla suma un
// sello. Al llegar a `sellos_requeridos`, la cartilla vuelve a cero y la
// paciente gana una sesión gratis, guardada como un paquete de 1 sesión a
// Bs 0 (`es_premio`), que la próxima cita de ese servicio consume sola.

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Normaliza el número de serie leído por un lector USB (decimal o hex) o por
// Web NFC ("04:a2:3f:..."): hex en mayúsculas, sin separadores.
function normalizarUid(valor) {
  if (typeof valor !== 'string' && typeof valor !== 'number') return '';
  const limpio = String(valor).trim().replace(/[\s:-]/g, '').toUpperCase();
  if (!limpio || limpio.length > 64) return '';
  // Muchos lectores USB "tipo teclado" escriben el UID en decimal (10 dígitos).
  if (/^\d{10}$/.test(limpio)) return Number(limpio).toString(16).toUpperCase().padStart(8, '0');
  return /^[0-9A-F]+$/.test(limpio) ? limpio : '';
}

async function esSesionPremio(cita) {
  if (!cita.paquete_sesiones_id) return false;
  const paquete = await db.PaqueteSesiones.findByPk(cita.paquete_sesiones_id);
  return Boolean(paquete && paquete.es_premio);
}

// Devuelve { servicio, sellos, requeridos, premio } o null si no corresponde sello.
async function otorgarSello(cita, usuarioId) {
  if (cita.sello_otorgado) return null;
  const servicio = await db.Servicio.findByPk(cita.servicio_id);
  const requeridos = servicio && servicio.sellos_requeridos;
  if (!requeridos || requeridos < 1) return null;
  if (await esSesionPremio(cita)) return null;

  const [cartilla] = await db.CartillaSellos.findOrCreate({
    where: { paciente_id: cita.paciente_id, servicio_id: servicio.id },
  });
  let premio = false;
  cartilla.sellos += 1;
  if (cartilla.sellos >= requeridos) {
    cartilla.sellos = 0;
    cartilla.premios_ganados += 1;
    premio = true;
    await db.PaqueteSesiones.create({
      paciente_id: cita.paciente_id,
      servicio_id: servicio.id,
      sesiones_totales: 1,
      precio_total: 0,
      fecha_compra: hoyISO(),
      estado: 'pagado',
      usuario_id: usuarioId,
      es_premio: true,
    });
  }
  await cartilla.save();
  cita.sello_otorgado = true;
  await cita.save();
  return { servicio: servicio.nombre, sellos: premio ? requeridos : cartilla.sellos, requeridos, premio };
}

// Deshace el sello si la cita deja de estar completada. Si ese sello había dado
// un premio que todavía no se usó, el premio se retira.
async function revertirSello(cita) {
  if (!cita.sello_otorgado) return;
  const servicio = await db.Servicio.findByPk(cita.servicio_id);
  const cartilla = await db.CartillaSellos.findOne({
    where: { paciente_id: cita.paciente_id, servicio_id: cita.servicio_id },
  });
  if (cartilla) {
    if (cartilla.sellos > 0) {
      cartilla.sellos -= 1;
    } else {
      const premio = await db.PaqueteSesiones.findOne({
        where: { paciente_id: cita.paciente_id, servicio_id: cita.servicio_id, es_premio: true, sesiones_usadas: 0 },
        order: [['id', 'DESC']],
      });
      if (premio) {
        await premio.destroy();
        cartilla.premios_ganados = Math.max(0, cartilla.premios_ganados - 1);
        cartilla.sellos = Math.max(0, ((servicio && servicio.sellos_requeridos) || 1) - 1);
      }
    }
    await cartilla.save();
  }
  cita.sello_otorgado = false;
  await cita.save();
}

// Cartillas de los servicios con programa activo y premios sin usar.
async function resumenSellos(pacienteId) {
  const [servicios, cartillas, premios] = await Promise.all([
    db.Servicio.findAll({
      where: { activo: true, sellos_requeridos: { [Op.gt]: 0 } },
      attributes: ['id', 'nombre', 'sellos_requeridos'],
      order: [['nombre', 'ASC']],
    }),
    db.CartillaSellos.findAll({ where: { paciente_id: pacienteId } }),
    db.PaqueteSesiones.findAll({
      where: { paciente_id: pacienteId, es_premio: true },
      include: [{ model: db.Servicio, attributes: ['id', 'nombre'] }],
    }),
  ]);
  const porServicio = new Map(cartillas.map((c) => [c.servicio_id, c]));
  return {
    cartillas: servicios.map((s) => ({
      servicioId: s.id,
      servicio: s.nombre,
      sellos: porServicio.get(s.id)?.sellos || 0,
      requeridos: s.sellos_requeridos,
      premiosGanados: porServicio.get(s.id)?.premios_ganados || 0,
    })),
    premiosDisponibles: premios
      .filter((p) => p.sesiones_usadas < p.sesiones_totales)
      .map((p) => ({ id: p.id, servicioId: p.servicio_id, servicio: p.Servicio ? p.Servicio.nombre : '' })),
  };
}

module.exports = { normalizarUid, otorgarSello, revertirSello, resumenSellos };

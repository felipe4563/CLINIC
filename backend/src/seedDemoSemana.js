// Script de un solo uso para poblar la base de datos local con datos
// realistas de "una semana de uso" (pacientes, citas, pagos, notas clinicas,
// compras, ventas, asistencia, ausencias y fidelizacion), para poder revisar
// como se ve el sistema con datos reales en vez de vacio.
//
// Uso: node src/seedDemoSemana.js
'use strict';

const db = require('./models');
const { generarCodigoCliente } = require('./services/codigoCliente');
const { otorgarPuntosPorGasto } = require('./services/fidelizacion');

function pad(n) {
  return String(n).padStart(2, '0');
}

function fechaOffset(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d;
}

function iso(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function sumarMinutos(hora, minutos) {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + minutos;
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}:00`;
}

const NOTAS_EJEMPLOS = [
  (servicio) =>
    `Procedimiento de ${servicio.toLowerCase()} realizado sin complicaciones. Piel con buena tolerancia, se recomienda hidratación diaria y protector solar.`,
  (servicio) =>
    `Paciente acude para ${servicio.toLowerCase()}. Se observa buena evolución respecto a la sesión anterior. Continuar con el plan de tratamiento.`,
  (servicio) =>
    `Sesión de ${servicio.toLowerCase()} completada. Leve enrojecimiento post-procedimiento, cede en las primeras horas. Próximo control en 3 semanas.`,
  (servicio) =>
    `Se realiza ${servicio.toLowerCase()}. Paciente refiere satisfacción con resultados previos. Sin reacciones adversas.`,
];

async function main() {
  const citasExistentes = await db.Cita.count();
  if (citasExistentes > 0) {
    console.log('Ya existen citas en la base de datos: se omite el seed de datos de demo.');
    await db.sequelize.close();
    return;
  }

  console.log('Creando catálogo base...');

  const [admin] = await db.Usuario.findOrCreate({ where: { email: 'admin@clinicnovaged.com' } });
  const recepcionRol = await db.Rol.findOne({ where: { nombre: 'Profesional' } });
  const [usuarioFelipe] = await db.Usuario.findOrCreate({
    where: { email: 'ruben16felipe@gmail.com' },
    defaults: { nombre: 'felipe', password_hash: admin.password_hash, rol_id: recepcionRol ? recepcionRol.id : null },
  });

  const [profExistente] = await db.Profesional.findAll({ limit: 1 });
  const [profCamila] = await db.Profesional.findOrCreate({
    where: { nombre: 'Dra. Camila Rojas' },
    defaults: { especialidad: 'Medicina Estética', activo: true },
  });
  const [profDiego] = await db.Profesional.findOrCreate({
    where: { nombre: 'Lic. Diego Fernández' },
    defaults: { especialidad: 'Cosmetología', activo: true },
  });
  const profesionales = [profExistente, profCamila, profDiego].filter(Boolean);

  for (const prof of profesionales) {
    for (let dia = 1; dia <= 5; dia++) {
      await db.HorarioDisponible.findOrCreate({
        where: { profesional_id: prof.id, dia_semana: dia },
        defaults: { hora_inicio: '09:00:00', hora_fin: '17:00:00' },
      });
    }
  }

  const SERVICIOS_NUEVOS = [
    { nombre: 'Limpieza facial profunda', duracion_min: 60, precio: 180 },
    { nombre: 'Botox facial', duracion_min: 45, precio: 850 },
    { nombre: 'Depilación láser - piernas', duracion_min: 40, precio: 320 },
    { nombre: 'Masaje relajante', duracion_min: 50, precio: 150 },
    { nombre: 'Peeling químico', duracion_min: 40, precio: 280 },
  ];
  const servicios = [];
  for (const s of SERVICIOS_NUEVOS) {
    const [servicio] = await db.Servicio.findOrCreate({ where: { nombre: s.nombre }, defaults: s });
    servicios.push(servicio);
  }
  const servicioConsulta = await db.Servicio.findOne({ where: { nombre: 'Consulta general' } });
  if (servicioConsulta) servicios.push(servicioConsulta);

  const porNombre = (nombre) => servicios.find((s) => s.nombre === nombre);
  const asignaciones = [
    [profExistente, ['Consulta general', 'Botox facial']],
    [profCamila, ['Botox facial', 'Peeling químico', 'Limpieza facial profunda']],
    [profDiego, ['Limpieza facial profunda', 'Depilación láser - piernas', 'Masaje relajante']],
  ];
  const serviciosPorProfesional = new Map();
  for (const [prof, nombresServicios] of asignaciones) {
    if (!prof) continue;
    const lista = nombresServicios.map(porNombre).filter(Boolean);
    serviciosPorProfesional.set(prof.id, lista);
    for (const servicio of lista) {
      await db.ServicioProfesional.findOrCreate({ where: { servicio_id: servicio.id, profesional_id: prof.id } });
    }
  }

  const marcas = {};
  for (const nombre of ['Dermalogica', 'La Roche-Posay', 'CeraVe']) {
    const [m] = await db.Marca.findOrCreate({ where: { nombre } });
    marcas[nombre] = m;
  }
  const categorias = {};
  for (const nombre of ['Skincare', 'Limpieza', 'Protección solar']) {
    const [c] = await db.CategoriaProducto.findOrCreate({ where: { nombre } });
    categorias[nombre] = c;
  }

  const PRODUCTOS_NUEVOS = [
    { nombre: 'Sérum Vitamina C 30ml', marca: 'Dermalogica', categoria: 'Skincare', stock_minimo: 5, precio_venta: 180, precio_costo: 110 },
    { nombre: 'Protector solar SPF50', marca: 'La Roche-Posay', categoria: 'Protección solar', stock_minimo: 8, precio_venta: 150, precio_costo: 90 },
    { nombre: 'Limpiador facial espumoso', marca: 'CeraVe', categoria: 'Limpieza', stock_minimo: 10, precio_venta: 95, precio_costo: 55 },
    { nombre: 'Crema hidratante facial', marca: 'CeraVe', categoria: 'Skincare', stock_minimo: 6, precio_venta: 120, precio_costo: 70 },
    { nombre: 'Mascarilla de arcilla', marca: 'Dermalogica', categoria: 'Skincare', stock_minimo: 5, precio_venta: 160, precio_costo: 95 },
    { nombre: 'Exfoliante corporal', marca: 'La Roche-Posay', categoria: 'Limpieza', stock_minimo: 4, precio_venta: 140, precio_costo: 80 },
  ];
  const productos = [];
  for (const p of PRODUCTOS_NUEVOS) {
    const [producto] = await db.Producto.findOrCreate({
      where: { nombre: p.nombre },
      defaults: {
        nombre: p.nombre,
        marca_id: marcas[p.marca].id,
        categoria_id: categorias[p.categoria].id,
        unidad: 'unidad',
        stock: 0,
        stock_minimo: p.stock_minimo,
        precio_venta: p.precio_venta,
        precio_costo: p.precio_costo,
      },
    });
    productos.push(producto);
  }

  const [proveedor] = await db.Proveedor.findOrCreate({
    where: { nombre: 'Distribuidora Belleza SRL' },
    defaults: { contacto: 'Mariana Suárez', telefono: '77012345' },
  });

  console.log('Registrando activos de la clínica...');

  const ACTIVOS_CLINICA = [
    { nombre: 'Equipo de luz pulsada IPL', categoria: 'Equipo estético', marca: 'Lumenis', modelo: 'M22', numero_serie: 'LM-22-0847', ubicacion: 'Sala 1', fecha_adquisicion: iso(fechaOffset(-540)), valor_adquisicion: 45000, estado: 'operativo' },
    { nombre: 'Máquina de radiofrecuencia facial', categoria: 'Equipo estético', marca: 'InMode', modelo: 'FormaPlus', numero_serie: 'IM-FP-2231', ubicacion: 'Sala 2', fecha_adquisicion: iso(fechaOffset(-420)), valor_adquisicion: 28000, estado: 'operativo' },
    { nombre: 'Camilla de tratamiento eléctrica', categoria: 'Mobiliario', marca: 'Promotal', modelo: 'Ecopostural C5569', numero_serie: 'EP-5569-11', ubicacion: 'Sala 1', fecha_adquisicion: iso(fechaOffset(-600)), valor_adquisicion: 6500, estado: 'operativo' },
    { nombre: 'Camilla de tratamiento eléctrica', categoria: 'Mobiliario', marca: 'Promotal', modelo: 'Ecopostural C5569', numero_serie: 'EP-5569-12', ubicacion: 'Sala 2', fecha_adquisicion: iso(fechaOffset(-600)), valor_adquisicion: 6500, estado: 'operativo' },
    { nombre: 'Autoclave esterilizador', categoria: 'Esterilización', marca: 'Tuttnauer', modelo: '2340M', numero_serie: 'TT-2340-558', ubicacion: 'Esterilización', fecha_adquisicion: iso(fechaOffset(-730)), valor_adquisicion: 9800, estado: 'mantenimiento' },
    { nombre: 'Dermapen profesional', categoria: 'Equipo estético', marca: 'Dr. Pen', modelo: 'A7', numero_serie: 'DP-A7-3309', ubicacion: 'Sala 1', fecha_adquisicion: iso(fechaOffset(-150)), valor_adquisicion: 1200, estado: 'operativo' },
    { nombre: 'Lupa LED de diagnóstico', categoria: 'Equipo de diagnóstico', marca: 'Celestron', modelo: 'LED-5X', numero_serie: 'CL-5X-7742', ubicacion: 'Recepción', fecha_adquisicion: iso(fechaOffset(-300)), valor_adquisicion: 850, estado: 'operativo' },
    { nombre: 'Vaporizador facial de ozono', categoria: 'Equipo estético', marca: 'Gezatone', modelo: 'FS990', numero_serie: 'GZ-990-120', ubicacion: 'Sala 2', fecha_adquisicion: iso(fechaOffset(-900)), valor_adquisicion: 1800, estado: 'operativo' },
  ];
  for (const activo of ACTIVOS_CLINICA) {
    await db.ActivoClinica.findOrCreate({ where: { numero_serie: activo.numero_serie }, defaults: activo });
  }

  console.log('Registrando compras (reponiendo stock)...');

  async function crearCompra(offsetDias, itemsDef) {
    const fecha = iso(fechaOffset(offsetDias));
    let total = 0;
    const itemsCalculados = itemsDef.map((it) => {
      const subtotal = it.cantidad * it.costoUnitario;
      total += subtotal;
      return { ...it, subtotal };
    });

    const compra = await db.Compra.create({ fecha, total, nota: 'Reposición de stock', usuario_id: admin.id, proveedor_id: proveedor.id });
    for (const it of itemsCalculados) {
      await db.CompraItem.create({
        compra_id: compra.id,
        producto_id: it.producto.id,
        cantidad: it.cantidad,
        costo_unitario: it.costoUnitario,
        subtotal: it.subtotal,
        lote: it.lote,
        fecha_vencimiento: it.fechaVencimiento,
      });
      it.producto.stock += it.cantidad;
      await it.producto.save();
    }
    await db.MovimientoCaja.create({
      tipo: 'egreso',
      concepto: `Compra #${compra.id} - ${proveedor.nombre}`,
      monto: compra.total,
      fecha: compra.fecha,
      usuario_id: admin.id,
      compra_id: compra.id,
    });
    return compra;
  }

  const prontoAVencer = iso(fechaOffset(22));
  const lejosDeVencer = iso(fechaOffset(365));

  await crearCompra(-6, [
    { producto: productos[0], cantidad: 20, costoUnitario: 110, lote: 'LT-2026-09-A', fechaVencimiento: lejosDeVencer },
    { producto: productos[1], cantidad: 15, costoUnitario: 90, lote: 'LT-2026-09-B', fechaVencimiento: prontoAVencer },
    { producto: productos[2], cantidad: 25, costoUnitario: 55, lote: 'LT-2026-09-C', fechaVencimiento: lejosDeVencer },
  ]);
  await crearCompra(-3, [
    { producto: productos[3], cantidad: 18, costoUnitario: 70, lote: 'LT-2026-10-A', fechaVencimiento: lejosDeVencer },
    { producto: productos[4], cantidad: 12, costoUnitario: 95, lote: 'LT-2026-10-B', fechaVencimiento: prontoAVencer },
    { producto: productos[5], cantidad: 10, costoUnitario: 80, lote: 'LT-2026-10-C', fechaVencimiento: lejosDeVencer },
  ]);

  console.log('Creando pacientes...');

  const NOMBRES_PACIENTES = [
    'María Fernanda Quispe', 'Carlos Andrés Mamani', 'Lucía Gabriela Rojas', 'Jorge Luis Fernández',
    'Daniela Alejandra Vargas', 'Ana Belén Choque', 'Ricardo Andrés Flores', 'Paola Ximena Guzmán',
    'Esteban Rodrigo Paredes', 'Valeria Nicole Castro', 'Diego Armando Soliz', 'Camila Andrea Terán',
    'Fernando José Aguilar', 'Gabriela Estefanía Rocha',
  ];
  const pacientes = [];
  for (let i = 0; i < NOMBRES_PACIENTES.length; i++) {
    const telefono = `700${String(11000 + i * 37).padStart(5, '0')}`;
    const existente = await db.Paciente.findOne({ where: { telefono } });
    if (existente) {
      pacientes.push(existente);
      continue;
    }
    const anio = randInt(1965, 2004);
    const paciente = await db.Paciente.create({
      codigo_paciente: await generarCodigoCliente(db),
      nombre_completo: NOMBRES_PACIENTES[i],
      telefono,
      carnet_identidad: String(randInt(3000000, 9999999)),
      carnet_expedido: 'CB',
      fecha_nacimiento: `${anio}-${pad(randInt(1, 12))}-${pad(randInt(1, 28))}`,
    });
    pacientes.push(paciente);
  }

  console.log('Generando citas, pagos y notas clínicas de la última semana...');

  const HORAS_POSIBLES = ['09:00:00', '10:00:00', '11:00:00', '13:00:00', '14:00:00', '15:00:00', '16:00:00'];

  for (let offset = -6; offset <= 2; offset++) {
    const fechaDate = fechaOffset(offset);
    const diaSemana = fechaDate.getDay();
    if (diaSemana === 0 || diaSemana === 6) continue; // la clínica no atiende fin de semana
    const fecha = iso(fechaDate);

    for (const prof of profesionales) {
      const serviciosProf = serviciosPorProfesional.get(prof.id) || [];
      if (serviciosProf.length === 0) continue;

      const horasDelDia = [...HORAS_POSIBLES].sort(() => Math.random() - 0.5).slice(0, randInt(1, 3));
      for (const horaInicio of horasDelDia) {
        const servicio = pick(serviciosProf);
        const paciente = pick(pacientes);
        const horaFin = sumarMinutos(horaInicio, servicio.duracion_min);

        let estado;
        if (offset < 0) {
          const r = Math.random();
          estado = r < 0.72 ? 'completada' : r < 0.82 ? 'no_asistio' : r < 0.92 ? 'cancelada' : 'confirmada';
        } else if (offset === 0) {
          estado = horaInicio < '13:00:00' ? 'completada' : 'confirmada';
        } else {
          estado = Math.random() < 0.85 ? 'confirmada' : 'pendiente_pago';
        }

        const cita = await db.Cita.create({
          paciente_id: paciente.id,
          profesional_id: prof.id,
          servicio_id: servicio.id,
          fecha,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          estado,
        });

        const montoTotal = Number(servicio.precio);
        const porcentaje = Math.random() < 0.15 ? 50 : 100;
        const monto = Math.round(montoTotal * (porcentaje / 100) * 100) / 100;
        const pagoEstado = estado === 'pendiente_pago' ? 'pendiente' : 'pagado';
        const saldoCobrado = porcentaje === 50 && pagoEstado === 'pagado' ? Math.random() < 0.5 : false;

        const pago = await db.Pago.create({
          cita_id: cita.id,
          monto,
          monto_total: montoTotal,
          porcentaje,
          estado: pagoEstado,
          saldo_cobrado: saldoCobrado,
          metodo_pago_saldo: saldoCobrado ? 'efectivo' : null,
        });

        if (saldoCobrado) {
          await db.MovimientoCaja.create({
            tipo: 'ingreso',
            concepto: `Saldo cita ${cita.id} - ${paciente.nombre_completo}`,
            monto: montoTotal - monto,
            fecha,
            usuario_id: admin.id,
            pago_id: pago.id,
          });
        }

        if (estado === 'completada') {
          await otorgarPuntosPorGasto({
            pacienteId: paciente.id,
            monto: pago.monto_total,
            motivo: `Cita completada #${cita.id}`,
            citaId: cita.id,
          });

          if (Math.random() < 0.6) {
            await db.NotaClinica.create({
              paciente_id: paciente.id,
              profesional_id: prof.id,
              cita_id: cita.id,
              fecha,
              hora: horaInicio,
              titulo: `Seguimiento - ${servicio.nombre}`,
              notas: pick(NOTAS_EJEMPLOS)(servicio.nombre),
            });
          }
        }
      }
    }
  }

  console.log('Registrando ventas de mostrador...');

  const NOMBRES_WALKIN = ['Cliente mostrador', 'Venta rápida', null];
  for (let offset = -6; offset <= 0; offset++) {
    const fechaDate = fechaOffset(offset);
    if (fechaDate.getDay() === 0) continue;
    const fecha = iso(fechaDate);

    for (let v = 0; v < randInt(1, 2); v++) {
      const cantidadItems = randInt(1, 3);
      const itemsSeleccionados = [...productos].sort(() => Math.random() - 0.5).slice(0, cantidadItems);
      const items = [];
      let total = 0;
      for (const producto of itemsSeleccionados) {
        const cantidad = Math.min(randInt(1, 2), Math.max(producto.stock, 0));
        if (cantidad <= 0) continue;
        const subtotal = Number(producto.precio_venta) * cantidad;
        total += subtotal;
        items.push({ producto, cantidad, subtotal });
      }
      if (items.length === 0) continue;

      const pacienteVinculado = Math.random() < 0.5 ? pick(pacientes) : null;
      const venta = await db.Venta.create({
        fecha,
        total,
        metodo_pago: 'efectivo',
        estado: 'pagado',
        cliente_nombre: pacienteVinculado ? null : pick(NOMBRES_WALKIN),
        paciente_id: pacienteVinculado ? pacienteVinculado.id : null,
        usuario_id: admin.id,
      });

      for (const it of items) {
        await db.VentaItem.create({
          venta_id: venta.id,
          producto_id: it.producto.id,
          cantidad: it.cantidad,
          precio_unitario: it.producto.precio_venta,
          subtotal: it.subtotal,
        });
        it.producto.stock -= it.cantidad;
        await it.producto.save();
      }

      await db.MovimientoCaja.create({
        tipo: 'ingreso',
        concepto: `Venta #${venta.id}${venta.cliente_nombre ? ' - ' + venta.cliente_nombre : ''}`,
        monto: venta.total,
        fecha: venta.fecha,
        usuario_id: admin.id,
        venta_id: venta.id,
      });

      if (pacienteVinculado) {
        await otorgarPuntosPorGasto({
          pacienteId: pacienteVinculado.id,
          monto: venta.total,
          motivo: `Venta #${venta.id}`,
          ventaId: venta.id,
        });
      }
    }
  }

  console.log('Registrando asistencia del staff...');

  const staffAsistencia = [admin, usuarioFelipe];
  for (let offset = -6; offset <= 0; offset++) {
    const fechaDate = fechaOffset(offset);
    const diaSemana = fechaDate.getDay();
    if (diaSemana === 0 || diaSemana === 6) continue;
    const fecha = iso(fechaDate);

    for (const usuario of staffAsistencia) {
      const existente = await db.RegistroAsistencia.findOne({ where: { usuario_id: usuario.id, fecha } });
      if (existente) continue;
      const sinSalidaHoy = offset === 0 && Math.random() < 0.3;
      await db.RegistroAsistencia.create({
        usuario_id: usuario.id,
        fecha,
        hora_entrada: `${pad(randInt(8, 9))}:${pad(randInt(0, 59))}:00`,
        hora_salida: sinSalidaHoy ? null : `${pad(randInt(17, 18))}:${pad(randInt(0, 59))}:00`,
      });
    }
  }

  console.log('Registrando ausencias...');

  await db.Ausencia.findOrCreate({
    where: { usuario_id: usuarioFelipe.id, tipo: 'licencia_medica' },
    defaults: {
      fecha_desde: iso(fechaOffset(-4)),
      fecha_hasta: iso(fechaOffset(-3)),
      motivo: 'Reposo médico por gripe',
      estado: 'aprobado',
      aprobado_por_id: admin.id,
    },
  });
  await db.Ausencia.findOrCreate({
    where: { usuario_id: admin.id, tipo: 'vacacion' },
    defaults: {
      fecha_desde: iso(fechaOffset(10)),
      fecha_hasta: iso(fechaOffset(15)),
      motivo: 'Vacaciones familiares',
      estado: 'pendiente',
    },
  });

  console.log('Creando recompensas de fidelización y un canje de ejemplo...');

  const [recompensaDescuento] = await db.Recompensa.findOrCreate({
    where: { nombre: '10% de descuento en próxima compra' },
    defaults: { descripcion: 'Aplica sobre productos de catálogo', costo_puntos: 100 },
  });
  await db.Recompensa.findOrCreate({
    where: { nombre: 'Limpieza facial gratis' },
    defaults: { descripcion: 'Sesión de limpieza facial profunda sin costo', costo_puntos: 300 },
  });

  const pacientesConPuntos = await db.Paciente.findAll({ where: { id: pacientes.map((p) => p.id) }, order: [['puntos_actuales', 'DESC']] });
  const candidato = pacientesConPuntos.find((p) => p.puntos_actuales >= recompensaDescuento.costo_puntos);
  if (candidato) {
    candidato.puntos_actuales -= recompensaDescuento.costo_puntos;
    await candidato.save();
    await db.MovimientoPuntos.create({
      paciente_id: candidato.id,
      tipo: 'canje',
      puntos: -recompensaDescuento.costo_puntos,
      motivo: `Canje: ${recompensaDescuento.nombre}`,
      recompensa_id: recompensaDescuento.id,
      usuario_id: admin.id,
    });
    console.log(`Canje de ejemplo aplicado a ${candidato.nombre_completo}`);
  }

  console.log('Listo. Datos de una semana de demo generados.');
  await db.sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

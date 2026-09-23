const db = require('../src/models');
const { getSlotsDisponibles } = require('../src/services/disponibilidad');
const { proximoLunes, sumarDias } = require('./helpers/fechas');

describe('getSlotsDisponibles', () => {
  let profesional, servicio;
  const lunes = proximoLunes(0);
  const martes = sumarDias(lunes, 1);
  const lunesSiguiente = proximoLunes(1);

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    profesional = await db.Profesional.create({ nombre: 'Dra. Test' });
    servicio = await db.Servicio.create({ nombre: 'Consulta', duracion_min: 30, precio: 100 });
    await db.ServicioProfesional.create({ servicio_id: servicio.id, profesional_id: profesional.id });
    // dia_semana 1 = lunes
    await db.HorarioDisponible.create({
      profesional_id: profesional.id, dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '11:00:00',
    });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('returns all 30-min slots when no citas booked', async () => {
    const slots = await getSlotsDisponibles({
      profesionalId: profesional.id, servicioId: servicio.id, fecha: lunes,
    });
    expect(slots).toEqual([
      { hora_inicio: '09:00', hora_fin: '09:30' },
      { hora_inicio: '09:30', hora_fin: '10:00' },
      { hora_inicio: '10:00', hora_fin: '10:30' },
      { hora_inicio: '10:30', hora_fin: '11:00' },
    ]);
  });

  test('excludes slots already booked with a non-cancelled cita', async () => {
    const paciente = await db.Paciente.create({
      codigo_paciente: 'PAC-000002', nombre_completo: 'Paciente Test',
      telefono: '59170000002', carnet_identidad: '7654321', carnet_expedido: 'LP',
    });
    await db.Cita.create({
      paciente_id: paciente.id, profesional_id: profesional.id, servicio_id: servicio.id,
      fecha: lunes, hora_inicio: '09:30:00', hora_fin: '10:00:00', estado: 'confirmada',
    });

    const slots = await getSlotsDisponibles({
      profesionalId: profesional.id, servicioId: servicio.id, fecha: lunes,
    });
    expect(slots).toEqual([
      { hora_inicio: '09:00', hora_fin: '09:30' },
      { hora_inicio: '10:00', hora_fin: '10:30' },
      { hora_inicio: '10:30', hora_fin: '11:00' },
    ]);
  });

  test('returns empty array when day has no horario', async () => {
    // martes: no horario seeded (solo dia_semana 1 = lunes)
    const slots = await getSlotsDisponibles({
      profesionalId: profesional.id, servicioId: servicio.id, fecha: martes,
    });
    expect(slots).toEqual([]);
  });

  test('returns empty array for a date in the past', async () => {
    const slots = await getSlotsDisponibles({
      profesionalId: profesional.id, servicioId: servicio.id, fecha: '2020-01-01',
    });
    expect(slots).toEqual([]);
  });

  describe('pendiente_pago TTL', () => {
    let paciente;

    beforeAll(async () => {
      paciente = await db.Paciente.create({
        codigo_paciente: 'PAC-000003', nombre_completo: 'Paciente TTL',
        telefono: '59170000003', carnet_identidad: '1112223', carnet_expedido: 'LP',
      });
      // una semana despues del primer lunes usado arriba
    });

    test('a fresh pendiente_pago cita still blocks its slot', async () => {
      await db.Cita.create({
        paciente_id: paciente.id, profesional_id: profesional.id, servicio_id: servicio.id,
        fecha: lunesSiguiente, hora_inicio: '09:00:00', hora_fin: '09:30:00', estado: 'pendiente_pago',
      });

      const slots = await getSlotsDisponibles({
        profesionalId: profesional.id, servicioId: servicio.id, fecha: lunesSiguiente,
      });
      expect(slots).toEqual([
        { hora_inicio: '09:30', hora_fin: '10:00' },
        { hora_inicio: '10:00', hora_fin: '10:30' },
        { hora_inicio: '10:30', hora_fin: '11:00' },
      ]);
    });

    test('a stale pendiente_pago cita (older than 15 min) no longer blocks its slot', async () => {
      const cita = await db.Cita.create({
        paciente_id: paciente.id, profesional_id: profesional.id, servicio_id: servicio.id,
        fecha: lunesSiguiente, hora_inicio: '10:00:00', hora_fin: '10:30:00', estado: 'pendiente_pago',
      });
      const backdated = new Date(Date.now() - 20 * 60 * 1000);
      await db.Cita.update(
        { createdAt: backdated },
        { where: { id: cita.id }, silent: true },
      );

      const slots = await getSlotsDisponibles({
        profesionalId: profesional.id, servicioId: servicio.id, fecha: lunesSiguiente,
      });
      // the 09:00 slot is still blocked by the fresh cita from the previous test,
      // but the 10:00 slot (stale cita) is bookable again.
      expect(slots).toEqual([
        { hora_inicio: '09:30', hora_fin: '10:00' },
        { hora_inicio: '10:00', hora_fin: '10:30' },
        { hora_inicio: '10:30', hora_fin: '11:00' },
      ]);
    });
  });
});

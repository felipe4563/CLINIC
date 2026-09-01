const db = require('../src/models');
const { getSlotsDisponibles } = require('../src/services/disponibilidad');

describe('getSlotsDisponibles', () => {
  let profesional, servicio;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    profesional = await db.Profesional.create({ nombre: 'Dra. Test' });
    servicio = await db.Servicio.create({ nombre: 'Consulta', duracion_min: 30, precio: 100 });
    await db.ServicioProfesional.create({ servicio_id: servicio.id, profesional_id: profesional.id });
    // 2026-09-14 is a Monday -> dia_semana 1
    await db.HorarioDisponible.create({
      profesional_id: profesional.id, dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '11:00:00',
    });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('returns all 30-min slots when no citas booked', async () => {
    const slots = await getSlotsDisponibles({
      profesionalId: profesional.id, servicioId: servicio.id, fecha: '2026-09-14',
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
      fecha: '2026-09-14', hora_inicio: '09:30:00', hora_fin: '10:00:00', estado: 'confirmada',
    });

    const slots = await getSlotsDisponibles({
      profesionalId: profesional.id, servicioId: servicio.id, fecha: '2026-09-14',
    });
    expect(slots).toEqual([
      { hora_inicio: '09:00', hora_fin: '09:30' },
      { hora_inicio: '10:00', hora_fin: '10:30' },
      { hora_inicio: '10:30', hora_fin: '11:00' },
    ]);
  });

  test('returns empty array when day has no horario', async () => {
    // 2026-09-15 is a Tuesday, no horario seeded
    const slots = await getSlotsDisponibles({
      profesionalId: profesional.id, servicioId: servicio.id, fecha: '2026-09-15',
    });
    expect(slots).toEqual([]);
  });
});

const db = require('../src/models');

describe('models', () => {
  afterAll(async () => {
    await db.sequelize.close();
  });

  test('sequelize can authenticate and sync in test db', async () => {
    await db.sequelize.sync({ force: true });
    const rol = await db.Rol.create({ nombre: 'Admin' });
    expect(rol.id).toBeDefined();
  });

  test('Cita belongs to Paciente, Profesional, Servicio', async () => {
    const paciente = await db.Paciente.create({
      codigo_paciente: 'PAC-000001',
      nombre_completo: 'Test Paciente',
      telefono: '59170000001',
      carnet_identidad: '1234567',
      carnet_expedido: 'LP',
    });
    const profesional = await db.Profesional.create({ nombre: 'Dra. Test' });
    const servicio = await db.Servicio.create({
      nombre: 'Consulta', duracion_min: 30, precio: 100,
    });
    const cita = await db.Cita.create({
      paciente_id: paciente.id,
      profesional_id: profesional.id,
      servicio_id: servicio.id,
      fecha: '2026-09-10',
      hora_inicio: '10:00:00',
      hora_fin: '10:30:00',
    });
    expect(cita.estado).toBe('pendiente_pago');
  });
});

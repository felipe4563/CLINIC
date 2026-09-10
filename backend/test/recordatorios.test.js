jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));

const db = require('../src/models');
const { enviarPlantillaWhatsApp } = require('../src/services/whatsapp');
const { ejecutarRecordatorios } = require('../src/jobs/recordatorios');

function pad(n) {
  return String(n).padStart(2, '0');
}

function fechaHora(date) {
  return {
    fecha: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    hora: `${pad(date.getHours())}:${pad(date.getMinutes())}:00`,
  };
}

describe('job de recordatorios automaticos', () => {
  let paciente;
  let profesional;
  let servicio;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    paciente = await db.Paciente.create({
      codigo_paciente: 'PAC-JOB01',
      nombre_completo: 'Paciente Job',
      telefono: '59170000299',
      carnet_identidad: '1112223',
      carnet_expedido: 'CB',
    });
    profesional = await db.Profesional.create({ nombre: 'Dra. Job', activo: true });
    servicio = await db.Servicio.create({ nombre: 'Consulta Job', duracion_min: 30, precio: 200, activo: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  beforeEach(() => {
    enviarPlantillaWhatsApp.mockClear();
  });

  test('envia el recordatorio de 24h para una cita confirmada dentro de la ventana', async () => {
    const objetivo = fechaHora(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const cita = await db.Cita.create({
      fecha: objetivo.fecha,
      hora_inicio: objetivo.hora,
      hora_fin: objetivo.hora,
      estado: 'confirmada',
      paciente_id: paciente.id,
      profesional_id: profesional.id,
      servicio_id: servicio.id,
    });

    await ejecutarRecordatorios();

    expect(enviarPlantillaWhatsApp).toHaveBeenCalledWith(
      paciente.telefono,
      'recordatorio_24h',
      [cita.fecha, objetivo.hora.slice(0, 5)],
    );
  });

  test('no reenvia el mismo recordatorio si el job corre de nuevo', async () => {
    const objetivo = fechaHora(new Date(Date.now() + 2 * 60 * 60 * 1000));
    await db.Cita.create({
      fecha: objetivo.fecha,
      hora_inicio: objetivo.hora,
      hora_fin: objetivo.hora,
      estado: 'confirmada',
      paciente_id: paciente.id,
      profesional_id: profesional.id,
      servicio_id: servicio.id,
    });

    await ejecutarRecordatorios();
    const llamadasPrimeraVez = enviarPlantillaWhatsApp.mock.calls.length;
    expect(llamadasPrimeraVez).toBeGreaterThan(0);

    await ejecutarRecordatorios();
    expect(enviarPlantillaWhatsApp).toHaveBeenCalledTimes(llamadasPrimeraVez);
  });

  test('envia el recordatorio de saldo pendiente para citas ya pasadas con saldo sin cobrar', async () => {
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { fecha } = fechaHora(ayer);
    const citaPasada = await db.Cita.create({
      fecha,
      hora_inicio: '09:00:00',
      hora_fin: '09:30:00',
      estado: 'confirmada',
      paciente_id: paciente.id,
      profesional_id: profesional.id,
      servicio_id: servicio.id,
    });
    await db.Pago.create({
      cita_id: citaPasada.id,
      monto: 50,
      monto_total: 100,
      porcentaje: 50,
      estado: 'pagado',
      saldo_cobrado: false,
    });

    await ejecutarRecordatorios();

    expect(enviarPlantillaWhatsApp).toHaveBeenCalledWith(
      paciente.telefono,
      'saldo_pendiente',
      [paciente.nombre_completo, '50.00'],
    );
  });

  test('no envia el recordatorio de saldo pendiente si ya fue cobrado', async () => {
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { fecha } = fechaHora(ayer);
    const citaPasada = await db.Cita.create({
      fecha,
      hora_inicio: '10:00:00',
      hora_fin: '10:30:00',
      estado: 'confirmada',
      paciente_id: paciente.id,
      profesional_id: profesional.id,
      servicio_id: servicio.id,
    });
    await db.Pago.create({
      cita_id: citaPasada.id,
      monto: 50,
      monto_total: 100,
      porcentaje: 50,
      estado: 'pagado',
      saldo_cobrado: true,
    });

    await ejecutarRecordatorios();

    expect(enviarPlantillaWhatsApp).not.toHaveBeenCalledWith(
      paciente.telefono,
      'saldo_pendiente',
      expect.anything(),
    );
  });
});

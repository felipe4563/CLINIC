jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));

const bcrypt = require('bcryptjs');
const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { PERMISOS_POR_DEFECTO } = require('../src/config/permisos');

describe('Reporte de citas: montos retenidos por inasistencia', () => {
  let token;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    const [rol] = await db.Rol.findOrCreate({ where: { nombre: 'Admin' }, defaults: { permisos: PERMISOS_POR_DEFECTO.Admin } });
    await db.Usuario.create({ nombre: 'Admin', email: 'admin@test.com', password_hash: await bcrypt.hash('secret123', 10), rol_id: rol.id, activo: true });
    token = (await request(app).post('/staff/login').send({ email: 'admin@test.com', password: 'secret123' })).body.token;

    const servicio = await db.Servicio.create({ nombre: 'Consulta', duracion_min: 30, precio: 100 });
    const profesional = await db.Profesional.create({ nombre: 'Dra. Test' });
    const paciente = await db.Paciente.create({ nombre_completo: 'Ana', telefono: '59170000060', codigo_paciente: 'P-0060', carnet_identidad: '1234567', carnet_expedido: 'CB' });

    async function cita(hora, extraCita, extraPago) {
      const c = await db.Cita.create({ paciente_id: paciente.id, profesional_id: profesional.id, servicio_id: servicio.id, fecha: '2026-10-05', hora_inicio: `${hora}:00`, hora_fin: `${hora}:30`, estado: 'no_asistio', ...extraCita });
      await db.Pago.create({ cita_id: c.id, monto: 50, monto_total: 100, porcentaje: 50, estado: 'pagado', metodo_adelanto: 'qr_fijo', ...extraPago });
    }
    await cita('09', {}, {});
    await cita('10', {}, { monto: 100, porcentaje: 100, metodo_adelanto: 'qr_banco' });
    await cita('11', { justificacion_estado: 'aceptada', justificacion_registrada_en: new Date() }, {});
    await cita('12', {}, { metodo_adelanto: null });
    await cita('13', { estado: 'completada' }, {});
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('suma solo las inasistencias con adelanto y sin justificación aceptada', async () => {
    const res = await request(app).get('/staff/reportes/citas?desde=2026-10-01&hasta=2026-10-31').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.montoRetenido).toBe(150);
    expect(res.body.citasConMontoRetenido).toBe(2);
  });
});

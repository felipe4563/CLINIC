jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));

const bcrypt = require('bcryptjs');
const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { PERMISOS_POR_DEFECTO } = require('../src/config/permisos');

async function crearUsuario({ nombre, email, rolNombre }) {
  const [rol] = await db.Rol.findOrCreate({
    where: { nombre: rolNombre },
    defaults: { permisos: PERMISOS_POR_DEFECTO[rolNombre] || [] },
  });
  const password_hash = await bcrypt.hash('secret123', 10);
  return db.Usuario.create({ nombre, email, password_hash, rol_id: rol.id, activo: true });
}

describe('Reporte de personal', () => {
  let token;
  let ana;
  let beto;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    await crearUsuario({ nombre: 'Admin', email: 'admin@test.com', rolNombre: 'Admin' });
    ana = await crearUsuario({ nombre: 'Ana', email: 'ana@test.com', rolNombre: 'Recepcion' });
    beto = await crearUsuario({ nombre: 'Beto', email: 'beto@test.com', rolNombre: 'Recepcion' });

    await db.RegistroAsistencia.bulkCreate([
      { usuario_id: ana.id, fecha: '2026-01-05', hora_entrada: '09:00:00', hora_salida: '15:00:00', dentro_rango: true },
      { usuario_id: ana.id, fecha: '2026-01-06', hora_entrada: '09:00:00', hora_salida: null, dentro_rango: true },
      { usuario_id: ana.id, fecha: '2026-01-07', hora_entrada: '08:30:00', hora_salida: '14:30:00', dentro_rango: false },
      // Fuera del rango consultado: no debe contarse.
      { usuario_id: ana.id, fecha: '2026-02-01', hora_entrada: '09:00:00', hora_salida: '17:00:00', dentro_rango: true },
    ]);

    await db.Ausencia.bulkCreate([
      // Empieza antes del rango: solo cuentan los dias dentro (10 y 11).
      { usuario_id: beto.id, tipo: 'vacacion', fecha_desde: '2025-12-30', fecha_hasta: '2026-01-11', estado: 'aprobado', motivo: 'Fin de año' },
      { usuario_id: beto.id, tipo: 'permiso', fecha_desde: '2026-01-08', fecha_hasta: '2026-01-08', estado: 'pendiente' },
      { usuario_id: beto.id, tipo: 'falta_injustificada', fecha_desde: '2026-01-09', fecha_hasta: '2026-01-09', estado: 'rechazado' },
    ]);

    const login = await request(app).post('/staff/login').send({ email: 'admin@test.com', password: 'secret123' });
    token = login.body.token;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  async function pedir() {
    const res = await request(app)
      .get('/staff/reportes/personal?desde=2026-01-01&hasta=2026-01-31')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    return res.body;
  }

  test('detalle por dia, promedio y alertas de asistencia', async () => {
    const body = await pedir();
    const e = body.porEmpleado.find((x) => x.usuario === 'Ana');

    expect(e.diasTrabajados).toBe(3);
    expect(e.horasTrabajadas).toBe(12);
    // El promedio solo considera los dias con salida marcada.
    expect(e.promedioHorasDia).toBe(6);
    expect(e.diasSinSalida).toBe(1);
    expect(e.fueraDeRango).toBe(1);
    expect(e.dias.map((d) => d.fecha)).toEqual(['2026-01-05', '2026-01-06', '2026-01-07']);
    expect(e.dias[1]).toMatchObject({ horaEntrada: '09:00', horaSalida: null, sinSalida: true, horas: 0 });
    expect(e.dias[2]).toMatchObject({ horaEntrada: '08:30', horaSalida: '14:30', horas: 6, dentroRango: false });
  });

  test('ausencias: solo aprobadas cuentan dias, recortadas al rango; pendientes aparte', async () => {
    const body = await pedir();
    const e = body.porEmpleado.find((x) => x.usuario === 'Beto');

    expect(e.diasAusencia).toBe(11); // 2026-01-01 .. 2026-01-11
    expect(e.ausenciasPorTipo).toEqual({ vacacion: 11 });
    expect(e.ausenciasPendientes).toBe(1);
    expect(e.ausencias).toHaveLength(3);
    expect(e.ausencias[0]).toMatchObject({ tipo: 'vacacion', estado: 'aprobado', motivo: 'Fin de año', dias: 11 });
  });

  test('resumen general del periodo', async () => {
    const body = await pedir();
    expect(body.resumen).toEqual({
      horasTotales: 12,
      diasTrabajados: 3,
      diasAusencia: 11,
      alertas: 2,
    });
  });

  test('el PDF se genera', async () => {
    const res = await request(app)
      .get('/staff/reportes/personal/pdf?desde=2026-01-01&hasta=2026-01-31')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
  });
});

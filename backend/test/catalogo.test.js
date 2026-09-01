const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');

describe('catalogo + disponibilidad routes', () => {
  let profesional, servicio;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    servicio = await db.Servicio.create({ nombre: 'Consulta', duracion_min: 30, precio: 100, activo: true });
    profesional = await db.Profesional.create({ nombre: 'Dra. Test', activo: true });
    await db.ServicioProfesional.create({ servicio_id: servicio.id, profesional_id: profesional.id });
    await db.HorarioDisponible.create({
      profesional_id: profesional.id, dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '10:00:00',
    });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('GET /servicios lists active servicios', async () => {
    const res = await request(app).get('/servicios');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].nombre).toBe('Consulta');
  });

  test('GET /profesionales?servicioId filters by servicio', async () => {
    const res = await request(app).get(`/profesionales?servicioId=${servicio.id}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].nombre).toBe('Dra. Test');
  });

  test('GET /disponibilidad returns slots', async () => {
    const res = await request(app).get(
      `/disponibilidad?profesionalId=${profesional.id}&servicioId=${servicio.id}&fecha=2026-09-14`
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { hora_inicio: '09:00', hora_fin: '09:30' },
      { hora_inicio: '09:30', hora_fin: '10:00' },
    ]);
  });
});

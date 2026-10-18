const db = require('../src/models');
const migracion = require('../src/migrations/20261018000000-servicios-ortografia');

// Reproduce el daño de producción (letras no ASCII perdidas en la carga inicial) y corre la migración.
describe('migración 20261018000000-servicios-ortografia', () => {
  const nombre = async (id) => (await db.Servicio.findByPk(id))?.nombre;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('corrige tildes, renombra y borra; desactiva en vez de borrar si hay historial', async () => {
    const fillers = await db.Servicio.create({
      nombre: 'cido hialurnico (Fillers)',
      descripcion: 'Medicina Esttica  Armonizacin Facial  Tratamientos diseados para equilibrar y resaltar los rasgos faciales manteniendo resultados naturales y armnicos.',
      duracion_min: 60, precio: 2200, activo: true,
    });
    const presion = await db.Servicio.create({
      nombre: 'Control de presin arterial', descripcion: 'Enfermera  Medicin y registro de valores de tensin arterial.',
      duracion_min: 10, precio: 20, activo: true,
    });
    const drenaje = await db.Servicio.create({ nombre: 'Drenaje linftico', duracion_min: 60, precio: 200, activo: true });
    const lunares = await db.Servicio.create({ nombre: 'Eliminacin de lunares', duracion_min: 30, precio: 300, activo: true });
    const terapia = await db.Servicio.create({ nombre: 'Terapia manual', duracion_min: 45, precio: 180, activo: true });
    // Editado a mano en el panel, con tildes: no se toca.
    const editado = await db.Servicio.create({ nombre: 'Eliminación de verrugas (plasma)', duracion_min: 30, precio: 250, activo: true });
    const producto = await db.Producto.create({ nombre: 'Lidocana 2% con epinefrina 20 ml', precio_venta: 50 });

    const profesional = await db.Profesional.create({ nombre: 'Dra. Test', activo: true });
    const paciente = await db.Paciente.create({ nombre_completo: 'Ana Paciente', telefono: '59170000099', codigo_paciente: 'P-0099', carnet_identidad: '7654321', carnet_expedido: 'CB' });
    await db.Cita.create({
      paciente_id: paciente.id, profesional_id: profesional.id, servicio_id: terapia.id,
      fecha: '2026-10-01', hora_inicio: '10:00:00', hora_fin: '10:45:00', estado: 'completada',
    });

    await migracion.up(db.sequelize.getQueryInterface());

    const f = await db.Servicio.findByPk(fillers.id);
    expect(f.nombre).toBe('Ácido hialurónico (Fillers)');
    expect(f.descripcion).toBe('Medicina Estética · Armonización Facial — Tratamientos diseñados para equilibrar y resaltar los rasgos faciales manteniendo resultados naturales y armónicos.');

    const p = await db.Servicio.findByPk(presion.id);
    expect(p.nombre).toBe('Control de signos vitales');
    expect(p.descripcion).toMatch(/^Enfermería — Medición y registro de signos vitales/);

    expect(await nombre(drenaje.id)).toBe('Drenaje linfático manual');
    expect(await db.Servicio.findByPk(lunares.id)).toBeNull();

    const t = await db.Servicio.findByPk(terapia.id);
    expect(t).not.toBeNull();
    expect(t.activo).toBe(false);

    expect(await nombre(editado.id)).toBe('Eliminación de verrugas (plasma)');
    expect((await db.Producto.findByPk(producto.id)).nombre).toBe('Lidocaína 2% con epinefrina 20 ml');

    // Correrla de nuevo no cambia nada.
    await migracion.up(db.sequelize.getQueryInterface());
    expect(await nombre(fillers.id)).toBe('Ácido hialurónico (Fillers)');
    expect(await nombre(drenaje.id)).toBe('Drenaje linfático manual');
  });
});

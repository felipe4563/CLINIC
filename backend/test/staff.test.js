jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));

const bcrypt = require('bcryptjs');
const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { PERMISOS_POR_DEFECTO } = require('../src/config/permisos');
const { enviarPlantillaWhatsApp } = require('../src/services/whatsapp');

async function crearUsuario({ email, password, rolNombre, activo = true }) {
  const [rol] = await db.Rol.findOrCreate({
    where: { nombre: rolNombre },
    defaults: { permisos: PERMISOS_POR_DEFECTO[rolNombre] || [] },
  });
  const password_hash = await bcrypt.hash(password, 10);
  return db.Usuario.create({ nombre: `Test ${rolNombre}`, email, password_hash, rol_id: rol.id, activo });
}

describe('Staff (sistema interno)', () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('auth y permisos por rol', () => {
    beforeAll(async () => {
      await crearUsuario({ email: 'admin@test.com', password: 'secret123', rolNombre: 'Admin' });
      await crearUsuario({ email: 'recepcion@test.com', password: 'secret123', rolNombre: 'Recepcion' });
      await crearUsuario({ email: 'inactivo@test.com', password: 'secret123', rolNombre: 'Recepcion', activo: false });
      await db.Rol.findOrCreate({ where: { nombre: 'Profesional' }, defaults: { permisos: PERMISOS_POR_DEFECTO.Profesional } });
    });

    test('login con credenciales validas devuelve token y rol', async () => {
      const res = await request(app)
        .post('/staff/login')
        .send({ email: 'admin@test.com', password: 'secret123' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.usuario.rol).toBe('Admin');
    });

    test('login con password incorrecta devuelve 401', async () => {
      const res = await request(app)
        .post('/staff/login')
        .send({ email: 'admin@test.com', password: 'wrong' });
      expect(res.status).toBe(401);
    });

    test('login de usuario inactivo devuelve 401', async () => {
      const res = await request(app)
        .post('/staff/login')
        .send({ email: 'inactivo@test.com', password: 'secret123' });
      expect(res.status).toBe(401);
    });

    test('ruta staff sin token devuelve 401', async () => {
      const res = await request(app).get('/staff/pacientes');
      expect(res.status).toBe(401);
    });

    test('Recepcion no puede acceder a rutas exclusivas de Admin', async () => {
      const login = await request(app)
        .post('/staff/login')
        .send({ email: 'recepcion@test.com', password: 'secret123' });

      const res = await request(app)
        .get('/staff/usuarios')
        .set('Authorization', `Bearer ${login.body.token}`);
      expect(res.status).toBe(403);
    });

    test('Admin puede listar y crear usuarios internos', async () => {
      const login = await request(app)
        .post('/staff/login')
        .send({ email: 'admin@test.com', password: 'secret123' });

      const list = await request(app)
        .get('/staff/usuarios')
        .set('Authorization', `Bearer ${login.body.token}`);
      expect(list.status).toBe(200);
      expect(list.body.length).toBeGreaterThanOrEqual(3);
      expect(list.body[0].password_hash).toBeUndefined();

      const crear = await request(app)
        .post('/staff/usuarios')
        .set('Authorization', `Bearer ${login.body.token}`)
        .send({ nombre: 'Nueva Profesional', email: 'prof@test.com', password: 'secret123', rolNombre: 'Profesional' });
      expect(crear.status).toBe(201);
      expect(crear.body.rol).toBe('Profesional');
    });
  });

  describe('agenda y pacientes', () => {
    let token;
    let paciente;
    let profesional;
    let servicio;

    beforeAll(async () => {
      await crearUsuario({ email: 'admin2@test.com', password: 'secret123', rolNombre: 'Admin' });
      const login = await request(app)
        .post('/staff/login')
        .send({ email: 'admin2@test.com', password: 'secret123' });
      token = login.body.token;

      paciente = await db.Paciente.create({
        codigo_paciente: 'PAC-000001',
        nombre_completo: 'Paciente Prueba',
        telefono: '59170000099',
        carnet_identidad: '1234567',
        carnet_expedido: 'CB',
      });
      profesional = await db.Profesional.create({ nombre: 'Dra. Prueba', activo: true });
      servicio = await db.Servicio.create({ nombre: 'Consulta', duracion_min: 30, precio: 100, activo: true });
      await db.ServicioProfesional.create({ servicio_id: servicio.id, profesional_id: profesional.id });
      for (let dia = 0; dia <= 6; dia += 1) {
        await db.HorarioDisponible.create({ profesional_id: profesional.id, dia_semana: dia, hora_inicio: '09:00:00', hora_fin: '17:00:00' });
      }

      await db.Cita.create({
        fecha: '2030-09-10',
        hora_inicio: '09:00:00',
        hora_fin: '09:30:00',
        estado: 'pendiente_pago',
        paciente_id: paciente.id,
        profesional_id: profesional.id,
        servicio_id: servicio.id,
      });
    });

    test('lista citas por fecha', async () => {
      const res = await request(app)
        .get('/staff/citas?fecha=2030-09-10')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].Paciente.nombre_completo).toBe('Paciente Prueba');
    });

    test('lista citas por rango desde/hasta', async () => {
      const res = await request(app)
        .get('/staff/citas?desde=2030-09-01&hasta=2030-09-30')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.some((c) => c.fecha === '2030-09-10')).toBe(true);
    });

    test('actualiza estado de una cita', async () => {
      const cita = await db.Cita.findOne({ where: { paciente_id: paciente.id } });
      const res = await request(app)
        .patch(`/staff/citas/${cita.id}/estado`)
        .set('Authorization', `Bearer ${token}`)
        .send({ estado: 'confirmada' });
      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('confirmada');
    });

    test('busca pacientes por texto', async () => {
      const res = await request(app)
        .get('/staff/pacientes?q=Prueba')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    test('obtiene ficha de paciente con su historial de citas', async () => {
      const res = await request(app)
        .get(`/staff/pacientes/${paciente.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.Cita.length).toBe(1);
    });

    test('crea un paciente nuevo desde el staff', async () => {
      const res = await request(app)
        .post('/staff/pacientes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre_completo: 'Paciente Nuevo Staff',
          telefono: '59170000299',
          carnet_identidad: '9998887',
          carnet_expedido: 'CB',
        });
      expect(res.status).toBe(201);
      expect(res.body.codigo_paciente).toMatch(/^NOVA-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/);
    });

    test('rechaza crear paciente con telefono duplicado', async () => {
      const res = await request(app)
        .post('/staff/pacientes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre_completo: 'Duplicado',
          telefono: '59170000099',
          carnet_identidad: '1112223',
          carnet_expedido: 'CB',
        });
      expect(res.status).toBe(409);
    });

    test('crea una cita manual y bloquea el mismo horario para otra', async () => {
      const crear = await request(app)
        .post('/staff/citas')
        .set('Authorization', `Bearer ${token}`)
        .send({
          pacienteId: paciente.id,
          profesionalId: profesional.id,
          servicioId: servicio.id,
          fecha: '2026-09-11',
          horaInicio: '10:00',
          pagada: true,
        });
      expect(crear.status).toBe(201);
      expect(crear.body.cita.estado).toBe('confirmada');
      expect(crear.body.pago.estado).toBe('pagado');
      expect(crear.body.cita.Paciente.nombre_completo).toBe('Paciente Prueba');

      const chocar = await request(app)
        .post('/staff/citas')
        .set('Authorization', `Bearer ${token}`)
        .send({
          pacienteId: paciente.id,
          profesionalId: profesional.id,
          servicioId: servicio.id,
          fecha: '2026-09-11',
          horaInicio: '10:00',
        });
      expect(chocar.status).toBe(409);
    });
  });

  describe('saldos pendientes y tratamientos', () => {
    let token;
    let paciente;
    let profesional;
    let servicio;
    let citaConSena;

    beforeAll(async () => {
      await crearUsuario({ email: 'admin-saldos@test.com', password: 'secret123', rolNombre: 'Admin' });
      const login = await request(app)
        .post('/staff/login')
        .send({ email: 'admin-saldos@test.com', password: 'secret123' });
      token = login.body.token;

      paciente = await db.Paciente.create({
        codigo_paciente: 'PAC-SALDOS-001',
        nombre_completo: 'Paciente Saldos',
        telefono: '59170000399',
        carnet_identidad: '5554443',
        carnet_expedido: 'CB',
      });
      profesional = await db.Profesional.create({ nombre: 'Dra. Saldos', activo: true });
      servicio = await db.Servicio.create({ nombre: 'Limpieza facial', duracion_min: 30, precio: 400, activo: true });

      citaConSena = await db.Cita.create({
        fecha: '2026-09-15',
        hora_inicio: '09:00:00',
        hora_fin: '09:30:00',
        estado: 'confirmada',
        paciente_id: paciente.id,
        profesional_id: profesional.id,
        servicio_id: servicio.id,
      });
      await db.Pago.create({
        monto: 200,
        monto_total: 400,
        porcentaje: 50,
        estado: 'pagado',
        cita_id: citaConSena.id,
      });
    });

    test('lista los pagos con seña pagada y saldo pendiente por cobrar', async () => {
      const res = await request(app)
        .get('/staff/saldos-pendientes')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.some((p) => p.Cita.Paciente.nombre_completo === 'Paciente Saldos')).toBe(true);
    });

    test('marca un saldo como cobrado y desaparece del listado', async () => {
      const pago = await db.Pago.findOne({ where: { cita_id: citaConSena.id } });
      const marcar = await request(app)
        .patch(`/staff/pagos/${pago.id}/saldo`)
        .set('Authorization', `Bearer ${token}`);
      expect(marcar.status).toBe(200);
      expect(marcar.body.saldo_cobrado).toBe(true);

      const lista = await request(app)
        .get('/staff/saldos-pendientes')
        .set('Authorization', `Bearer ${token}`);
      expect(lista.body.some((p) => p.id === pago.id)).toBe(false);

      const movimiento = await db.MovimientoCaja.findOne({ where: { pago_id: pago.id } });
      expect(movimiento).not.toBeNull();
      expect(movimiento.tipo).toBe('ingreso');
      expect(Number(movimiento.monto)).toBe(200);
    });

    test('crea, lista, edita y elimina una nota clinica de un paciente', async () => {
      const crear = await request(app)
        .post(`/staff/pacientes/${paciente.id}/tratamientos`)
        .set('Authorization', `Bearer ${token}`)
        .send({ titulo: 'Control inicial', notas: 'Piel sensible, sin reacciones adversas.', profesionalId: profesional.id });
      expect(crear.status).toBe(201);
      expect(crear.body.Profesional.nombre).toBe('Dra. Saldos');

      const lista = await request(app)
        .get(`/staff/pacientes/${paciente.id}/tratamientos`)
        .set('Authorization', `Bearer ${token}`);
      expect(lista.status).toBe(200);
      expect(lista.body.length).toBe(1);

      const editar = await request(app)
        .patch(`/staff/tratamientos/${crear.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ notas: 'Piel sensible, tolero bien el tratamiento.' });
      expect(editar.status).toBe(200);
      expect(editar.body.notas).toBe('Piel sensible, tolero bien el tratamiento.');

      const eliminar = await request(app)
        .delete(`/staff/tratamientos/${crear.body.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(eliminar.status).toBe(204);
    });

    test('rechaza una nota clinica cuya hora choca con una cita del profesional', async () => {
      const res = await request(app)
        .post(`/staff/pacientes/${paciente.id}/tratamientos`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          titulo: 'Sesion',
          notas: 'No deberia poder crearse.',
          fecha: citaConSena.fecha,
          hora: '09:15',
          profesionalId: profesional.id,
        });
      expect(res.status).toBe(409);
    });

    test('permite una nota clinica a una hora libre del mismo profesional', async () => {
      const res = await request(app)
        .post(`/staff/pacientes/${paciente.id}/tratamientos`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          titulo: 'Sesion',
          notas: 'Hora libre, si se debe poder crear.',
          fecha: citaConSena.fecha,
          hora: '11:00',
          profesionalId: profesional.id,
        });
      expect(res.status).toBe(201);
    });

    test('busca notas clinicas por nombre de paciente en el listado general', async () => {
      await request(app)
        .post(`/staff/pacientes/${paciente.id}/tratamientos`)
        .set('Authorization', `Bearer ${token}`)
        .send({ titulo: 'Seguimiento', notas: 'Evolucion favorable.' });

      const res = await request(app)
        .get('/staff/tratamientos?q=Paciente Saldos')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.some((n) => n.titulo === 'Seguimiento')).toBe(true);
    });
  });

  describe('caja', () => {
    let token;
    const fecha = '2026-09-20';

    beforeAll(async () => {
      await crearUsuario({ email: 'admin-caja@test.com', password: 'secret123', rolNombre: 'Admin' });
      const login = await request(app)
        .post('/staff/login')
        .send({ email: 'admin-caja@test.com', password: 'secret123' });
      token = login.body.token;
    });

    test('registra un ingreso y un egreso, y calcula los totales del dia', async () => {
      const ingreso = await request(app)
        .post('/staff/caja')
        .set('Authorization', `Bearer ${token}`)
        .send({ tipo: 'ingreso', concepto: 'Venta de producto', monto: 150, fecha });
      expect(ingreso.status).toBe(201);
      expect(ingreso.body.Usuario.password_hash).toBeUndefined();

      const egreso = await request(app)
        .post('/staff/caja')
        .set('Authorization', `Bearer ${token}`)
        .send({ tipo: 'egreso', concepto: 'Compra de insumos', monto: 40, fecha });
      expect(egreso.status).toBe(201);

      const res = await request(app)
        .get(`/staff/caja?fecha=${fecha}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.totalIngresos).toBe(150);
      expect(res.body.totalEgresos).toBe(40);
      expect(res.body.saldoNeto).toBe(110);
      expect(res.body.movimientos.length).toBe(2);
    });

    test('elimina un movimiento manual', async () => {
      const crear = await request(app)
        .post('/staff/caja')
        .set('Authorization', `Bearer ${token}`)
        .send({ tipo: 'egreso', concepto: 'Movimiento a borrar', monto: 10, fecha });

      const eliminar = await request(app)
        .delete(`/staff/caja/${crear.body.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(eliminar.status).toBe(204);
    });

    test('rechaza tipo invalido', async () => {
      const res = await request(app)
        .post('/staff/caja')
        .set('Authorization', `Bearer ${token}`)
        .send({ tipo: 'otro', concepto: 'X', monto: 10 });
      expect(res.status).toBe(400);
    });
  });

  describe('inventario y ventas (POS)', () => {
    let token;
    let producto;

    beforeAll(async () => {
      await crearUsuario({ email: 'admin-inv@test.com', password: 'secret123', rolNombre: 'Admin' });
      const login = await request(app)
        .post('/staff/login')
        .send({ email: 'admin-inv@test.com', password: 'secret123' });
      token = login.body.token;
    });

    test('crea una marca y una categoria de producto', async () => {
      const marca = await request(app)
        .post('/staff/marcas')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Nivea' });
      expect(marca.status).toBe(201);

      const duplicada = await request(app)
        .post('/staff/marcas')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Nivea' });
      expect(duplicada.status).toBe(409);

      const categoria = await request(app)
        .post('/staff/categorias-producto')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Cosmético' });
      expect(categoria.status).toBe(201);
    });

    test('crea, lista y edita un producto con marca y categoria seleccionables', async () => {
      const marca = await db.Marca.findOne({ where: { nombre: 'Nivea' } });
      const categoria = await db.CategoriaProducto.findOne({ where: { nombre: 'Cosmético' } });

      const crear = await request(app)
        .post('/staff/productos')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Crema hidratante', marcaId: marca.id, categoriaId: categoria.id, stock: 10, precio_venta: 80, fecha_vencimiento: '2027-01-01' });
      expect(crear.status).toBe(201);
      expect(crear.body.Marca.nombre).toBe('Nivea');
      expect(crear.body.CategoriaProducto.nombre).toBe('Cosmético');
      producto = crear.body;

      const editar = await request(app)
        .patch(`/staff/productos/${producto.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ stock: 12 });
      expect(editar.status).toBe(200);
      expect(editar.body.stock).toBe(12);

      const lista = await request(app)
        .get('/staff/productos')
        .set('Authorization', `Bearer ${token}`);
      expect(lista.status).toBe(200);
      expect(lista.body.some((p) => p.id === producto.id)).toBe(true);
    });

    test('no permite eliminar una marca en uso, pero si una libre', async () => {
      const marca = await db.Marca.findOne({ where: { nombre: 'Nivea' } });
      const bloqueada = await request(app)
        .delete(`/staff/marcas/${marca.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(bloqueada.status).toBe(409);

      const libre = await request(app)
        .post('/staff/marcas')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Marca sin usar' });

      const eliminar = await request(app)
        .delete(`/staff/marcas/${libre.body.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(eliminar.status).toBe(204);
    });

    test('vincula un producto a un servicio y lo desvincula', async () => {
      const servicio = await db.Servicio.create({ nombre: 'Botox Test', duracion_min: 30, precio: 500, activo: true });

      const vincular = await request(app)
        .post(`/staff/servicios/${servicio.id}/productos`)
        .set('Authorization', `Bearer ${token}`)
        .send({ productoId: producto.id });
      expect(vincular.status).toBe(201);

      const lista = await request(app)
        .get('/staff/servicios')
        .set('Authorization', `Bearer ${token}`);
      const servicioConProducto = lista.body.find((s) => s.id === servicio.id);
      expect(servicioConProducto.Productos.some((p) => p.id === producto.id)).toBe(true);

      const desvincular = await request(app)
        .delete(`/staff/servicios/${servicio.id}/productos/${producto.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(desvincular.status).toBe(200);
    });

    test('crea un activo, lo da de baja y bloquea su edicion', async () => {
      const crear = await request(app)
        .post('/staff/activos')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Camilla electrica', categoria: 'Equipo medico' });
      expect(crear.status).toBe(201);

      const baja = await request(app)
        .post(`/staff/activos/${crear.body.id}/baja`)
        .set('Authorization', `Bearer ${token}`)
        .send({ motivo: 'Equipo dañado, no reparable' });
      expect(baja.status).toBe(200);
      expect(baja.body.estado).toBe('dado_de_baja');

      const editar = await request(app)
        .patch(`/staff/activos/${crear.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'x' });
      expect(editar.status).toBe(400);
    });

    test('registra una venta en efectivo, descuenta stock y genera ingreso en caja', async () => {
      const venta = await request(app)
        .post('/staff/ventas')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ productoId: producto.id, cantidad: 2 }], metodoPago: 'efectivo', clienteNombre: 'Cliente mostrador' });
      expect(venta.status).toBe(201);
      expect(venta.body.venta.estado).toBe('pagado');
      expect(Number(venta.body.venta.total)).toBe(160);

      const productoActualizado = await db.Producto.findByPk(producto.id);
      expect(productoActualizado.stock).toBe(10);

      const movimiento = await db.MovimientoCaja.findOne({ where: { venta_id: venta.body.venta.id } });
      expect(movimiento).not.toBeNull();
      expect(Number(movimiento.monto)).toBe(160);
    });

    test('rechaza una venta que excede el stock disponible', async () => {
      const res = await request(app)
        .post('/staff/ventas')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ productoId: producto.id, cantidad: 999 }], metodoPago: 'efectivo' });
      expect(res.status).toBe(409);
    });
  });

  describe('catalogo (solo Admin)', () => {
    let token;

    beforeAll(async () => {
      await crearUsuario({ email: 'admin3@test.com', password: 'secret123', rolNombre: 'Admin' });
      const login = await request(app)
        .post('/staff/login')
        .send({ email: 'admin3@test.com', password: 'secret123' });
      token = login.body.token;
    });

    test('crea, lista y edita un servicio', async () => {
      const crear = await request(app)
        .post('/staff/servicios')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Botox', duracion_min: 45, precio: 500 });
      expect(crear.status).toBe(201);

      const editar = await request(app)
        .patch(`/staff/servicios/${crear.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ precio: 550 });
      expect(editar.status).toBe(200);
      expect(Number(editar.body.precio)).toBe(550);
    });

    test('crea profesional, lo vincula a un servicio y le agrega horario', async () => {
      const crearServicio = await request(app)
        .post('/staff/servicios')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Peeling', duracion_min: 30, precio: 200 });

      const crearProf = await request(app)
        .post('/staff/profesionales')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Dr. Nuevo' });
      expect(crearProf.status).toBe(201);

      const vincular = await request(app)
        .post(`/staff/profesionales/${crearProf.body.id}/servicios`)
        .set('Authorization', `Bearer ${token}`)
        .send({ servicioId: crearServicio.body.id });
      expect(vincular.status).toBe(201);

      const horario = await request(app)
        .post(`/staff/profesionales/${crearProf.body.id}/horarios`)
        .set('Authorization', `Bearer ${token}`)
        .send({ dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '17:00:00' });
      expect(horario.status).toBe(201);
    });
  });

  describe('dashboard', () => {
    let token;

    function hoyISO() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    beforeAll(async () => {
      await crearUsuario({ email: 'admin4@test.com', password: 'secret123', rolNombre: 'Admin' });
      const login = await request(app)
        .post('/staff/login')
        .send({ email: 'admin4@test.com', password: 'secret123' });
      token = login.body.token;

      const paciente = await db.Paciente.create({
        codigo_paciente: 'PAC-DASH-001',
        nombre_completo: 'Paciente Dashboard',
        telefono: '59170000199',
        carnet_identidad: '7654321',
        carnet_expedido: 'CB',
      });
      const profesional = await db.Profesional.create({ nombre: 'Dra. Dashboard', activo: true });
      const servicio = await db.Servicio.create({ nombre: 'Consulta Dashboard', duracion_min: 30, precio: 300, activo: true });

      const citaHoy = await db.Cita.create({
        fecha: hoyISO(),
        hora_inicio: '10:00:00',
        hora_fin: '10:30:00',
        estado: 'confirmada',
        paciente_id: paciente.id,
        profesional_id: profesional.id,
        servicio_id: servicio.id,
      });
      await db.Pago.create({ monto: 300, monto_total: 300, porcentaje: 100, estado: 'pagado', cita_id: citaHoy.id });

      await db.Cita.create({
        fecha: hoyISO(),
        hora_inicio: '11:00:00',
        hora_fin: '11:30:00',
        estado: 'cancelada',
        paciente_id: paciente.id,
        profesional_id: profesional.id,
        servicio_id: servicio.id,
      });
    });

    test('devuelve metricas del periodo actual', async () => {
      const res = await request(app)
        .get('/staff/dashboard')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.citasHoy).toBe(1);
      expect(res.body.ingresosPeriodo).toBeGreaterThanOrEqual(300);
      expect(res.body.proximasCitas.some((c) => c.Paciente.nombre_completo === 'Paciente Dashboard')).toBe(true);
    });

    test('acepta el parametro periodo=dia', async () => {
      const res = await request(app)
        .get('/staff/dashboard?periodo=dia')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.periodo).toBe('dia');
      expect(res.body.citasPeriodo).toBe(1);
    });
  });

  describe('roles y permisos', () => {
    let tokenAdmin;
    let adminUsuario;

    beforeAll(async () => {
      adminUsuario = await crearUsuario({ email: 'admin5@test.com', password: 'secret123', rolNombre: 'Admin' });
      const login = await request(app)
        .post('/staff/login')
        .send({ email: 'admin5@test.com', password: 'secret123' });
      tokenAdmin = login.body.token;
    });

    test('lista los modulos de permisos disponibles', async () => {
      const res = await request(app)
        .get('/staff/permisos-disponibles')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.some((m) => m.clave === 'usuarios')).toBe(true);
    });

    test('crea un rol personalizado con permisos limitados', async () => {
      const res = await request(app)
        .post('/staff/roles')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ nombre: 'Marketing Test', permisos: ['dashboard', 'pacientes', 'permiso-invalido'] });
      expect(res.status).toBe(201);
      expect(res.body.permisos).toEqual(['dashboard', 'pacientes']);
    });

    test('rechaza crear un rol con nombre duplicado', async () => {
      const res = await request(app)
        .post('/staff/roles')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ nombre: 'Marketing Test', permisos: [] });
      expect(res.status).toBe(409);
    });

    test('edita los permisos de un rol', async () => {
      const rol = await db.Rol.findOne({ where: { nombre: 'Marketing Test' } });
      const res = await request(app)
        .patch(`/staff/roles/${rol.id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ permisos: ['dashboard'] });
      expect(res.status).toBe(200);
      expect(res.body.permisos).toEqual(['dashboard']);
    });

    test('no permite eliminar un rol con usuarios asignados', async () => {
      const rol = await db.Rol.findOne({ where: { nombre: 'Marketing Test' } });
      await crearUsuario({ email: 'marketing@test.com', password: 'secret123', rolNombre: 'Marketing Test' });

      const res = await request(app)
        .delete(`/staff/roles/${rol.id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(409);
    });

    test('un usuario no puede quitarse a si mismo el permiso de usuarios', async () => {
      const res = await request(app)
        .patch(`/staff/usuarios/${adminUsuario.id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ rolNombre: 'Recepcion' });
      expect(res.status).toBe(400);
    });

    test('no permite quitarle el permiso de usuarios al rol Admin si ningun otro rol lo otorga', async () => {
      const rolAdmin = await db.Rol.findOne({ where: { nombre: 'Admin' } });
      const res = await request(app)
        .patch(`/staff/roles/${rolAdmin.id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ permisos: ['dashboard', 'agenda', 'pacientes', 'catalogo'] });
      expect(res.status).toBe(400);
    });
  });

  describe('automatizacion', () => {
    let tokenAdmin;
    let paciente;
    let profesional;
    let servicio;

    beforeAll(async () => {
      await crearUsuario({ email: 'admin-auto@test.com', password: 'secret123', rolNombre: 'Admin' });
      const login = await request(app)
        .post('/staff/login')
        .send({ email: 'admin-auto@test.com', password: 'secret123' });
      tokenAdmin = login.body.token;

      paciente = await db.Paciente.create({
        codigo_paciente: 'PAC-AUTO01',
        nombre_completo: 'Paciente Automatizacion',
        telefono: '59170000499',
        carnet_identidad: '7654321',
        carnet_expedido: 'CB',
      });
      profesional = await db.Profesional.create({ nombre: 'Dra. Auto', activo: true });
      servicio = await db.Servicio.create({ nombre: 'Consulta Auto', duracion_min: 30, precio: 100, activo: true });
    });

    beforeEach(() => {
      enviarPlantillaWhatsApp.mockClear();
    });

    async function crearCita(estadoInicial = 'confirmada') {
      return db.Cita.create({
        fecha: '2026-09-25',
        hora_inicio: '09:00:00',
        hora_fin: '09:30:00',
        estado: estadoInicial,
        paciente_id: paciente.id,
        profesional_id: profesional.id,
        servicio_id: servicio.id,
      });
    }

    test('rechaza el acceso a un rol sin el permiso automatizacion', async () => {
      await crearUsuario({ email: 'recepcion-auto@test.com', password: 'secret123', rolNombre: 'Recepcion' });
      const login = await request(app)
        .post('/staff/login')
        .send({ email: 'recepcion-auto@test.com', password: 'secret123' });

      const res = await request(app)
        .get('/staff/automatizacion')
        .set('Authorization', `Bearer ${login.body.token}`);
      expect(res.status).toBe(403);
    });

    test('marcar una cita como no_asistio envia y registra la notificacion automatica', async () => {
      const cita = await crearCita();

      const res = await request(app)
        .patch(`/staff/citas/${cita.id}/estado`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'no_asistio' });

      expect(res.status).toBe(200);
      expect(enviarPlantillaWhatsApp).toHaveBeenCalledTimes(1);
      expect(enviarPlantillaWhatsApp).toHaveBeenCalledWith(paciente.telefono, 'cita_no_asistio', [paciente.nombre_completo]);

      const notificacion = await db.NotificacionAutomatica.findOne({ where: { tipo: 'no_show', cita_id: cita.id } });
      expect(notificacion).not.toBeNull();
    });

    test('marcar la misma cita como no_asistio dos veces no reenvia el mensaje', async () => {
      const cita = await crearCita();

      await request(app)
        .patch(`/staff/citas/${cita.id}/estado`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'no_asistio' });
      await request(app)
        .patch(`/staff/citas/${cita.id}/estado`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'no_asistio' });

      expect(enviarPlantillaWhatsApp).toHaveBeenCalledTimes(1);
    });

    test('marcar una cita como completada envia el mensaje post-consulta', async () => {
      const cita = await crearCita();

      const res = await request(app)
        .patch(`/staff/citas/${cita.id}/estado`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'completada' });

      expect(res.status).toBe(200);
      expect(enviarPlantillaWhatsApp).toHaveBeenCalledWith(paciente.telefono, 'post_consulta', [paciente.nombre_completo]);
    });

    test('desactivar un tipo de automatizacion evita el envio', async () => {
      await request(app)
        .patch('/staff/automatizacion')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ no_show: false });

      const cita = await crearCita();
      await request(app)
        .patch(`/staff/citas/${cita.id}/estado`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'no_asistio' });

      expect(enviarPlantillaWhatsApp).not.toHaveBeenCalled();

      await request(app)
        .patch('/staff/automatizacion')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ no_show: true });
    });

    test('lista la configuracion y el registro de notificaciones enviadas', async () => {
      const res = await request(app)
        .get('/staff/automatizacion')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.config).toHaveProperty('recordatorio_24h');
      expect(Array.isArray(res.body.notificaciones)).toBe(true);
      expect(res.body.notificaciones.some((n) => n.tipo === 'no_show')).toBe(true);
    });
  });

  describe('control de personal', () => {
    let tokenAdmin;
    let tokenRecepcion;
    let recepcionUsuario;

    beforeAll(async () => {
      await crearUsuario({ email: 'admin-personal@test.com', password: 'secret123', rolNombre: 'Admin' });
      const loginAdmin = await request(app)
        .post('/staff/login')
        .send({ email: 'admin-personal@test.com', password: 'secret123' });
      tokenAdmin = loginAdmin.body.token;

      recepcionUsuario = await crearUsuario({ email: 'recepcion-personal@test.com', password: 'secret123', rolNombre: 'Recepcion' });
      const loginRecepcion = await request(app)
        .post('/staff/login')
        .send({ email: 'recepcion-personal@test.com', password: 'secret123' });
      tokenRecepcion = loginRecepcion.body.token;
    });

    test('un usuario sin registro de hoy ve null en /staff/asistencia/hoy', async () => {
      const res = await request(app)
        .get('/staff/asistencia/hoy')
        .set('Authorization', `Bearer ${tokenRecepcion}`);
      expect(res.status).toBe(200);
      expect(res.body).toBeNull();
    });

    test('marca su entrada, luego su salida, y rechaza una tercera marca', async () => {
      const entrada = await request(app)
        .post('/staff/asistencia/marcar')
        .set('Authorization', `Bearer ${tokenRecepcion}`);
      expect(entrada.status).toBe(201);
      expect(entrada.body.hora_entrada).not.toBeNull();
      expect(entrada.body.hora_salida).toBeNull();

      const salida = await request(app)
        .post('/staff/asistencia/marcar')
        .set('Authorization', `Bearer ${tokenRecepcion}`);
      expect(salida.status).toBe(200);
      expect(salida.body.hora_salida).not.toBeNull();

      const tercera = await request(app)
        .post('/staff/asistencia/marcar')
        .set('Authorization', `Bearer ${tokenRecepcion}`);
      expect(tercera.status).toBe(409);
    });

    test('un usuario sin permiso personal no puede ver la asistencia de todos', async () => {
      const res = await request(app)
        .get('/staff/asistencia')
        .set('Authorization', `Bearer ${tokenRecepcion}`);
      expect(res.status).toBe(403);
    });

    test('el admin con permiso personal ve la asistencia de todos', async () => {
      const res = await request(app)
        .get('/staff/asistencia')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.some((r) => r.usuario_id === recepcionUsuario.id)).toBe(true);
      expect(res.body[0].Usuario.password_hash).toBeUndefined();
    });

    test('solicita una ausencia propia en estado pendiente', async () => {
      const res = await request(app)
        .post('/staff/ausencias')
        .set('Authorization', `Bearer ${tokenRecepcion}`)
        .send({ tipo: 'vacacion', fechaDesde: '2026-10-01', fechaHasta: '2026-10-05', motivo: 'Viaje familiar' });
      expect(res.status).toBe(201);
      expect(res.body.estado).toBe('pendiente');
    });

    test('rechaza una ausencia con fechaHasta anterior a fechaDesde', async () => {
      const res = await request(app)
        .post('/staff/ausencias')
        .set('Authorization', `Bearer ${tokenRecepcion}`)
        .send({ tipo: 'permiso', fechaDesde: '2026-10-05', fechaHasta: '2026-10-01' });
      expect(res.status).toBe(400);
    });

    test('el admin aprueba la ausencia pendiente', async () => {
      const mias = await request(app)
        .get('/staff/ausencias/mias')
        .set('Authorization', `Bearer ${tokenRecepcion}`);
      const ausencia = mias.body.find((a) => a.estado === 'pendiente');

      const res = await request(app)
        .patch(`/staff/ausencias/${ausencia.id}/estado`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'aprobado' });
      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('aprobado');
    });

    test('el admin registra directamente una falta injustificada para otro usuario', async () => {
      const res = await request(app)
        .post('/staff/ausencias/registrar')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          usuarioId: recepcionUsuario.id,
          tipo: 'falta_injustificada',
          fechaDesde: '2026-09-08',
          fechaHasta: '2026-09-08',
        });
      expect(res.status).toBe(201);
      expect(res.body.estado).toBe('aprobado');
    });

    test('un usuario no puede eliminar una ausencia ya aprobada propia', async () => {
      const mias = await request(app)
        .get('/staff/ausencias/mias')
        .set('Authorization', `Bearer ${tokenRecepcion}`);
      const aprobada = mias.body.find((a) => a.estado === 'aprobado' && a.tipo === 'vacacion');

      const res = await request(app)
        .delete(`/staff/ausencias/${aprobada.id}`)
        .set('Authorization', `Bearer ${tokenRecepcion}`);
      expect(res.status).toBe(403);
    });

    test('un usuario puede eliminar su propia ausencia pendiente', async () => {
      const crear = await request(app)
        .post('/staff/ausencias')
        .set('Authorization', `Bearer ${tokenRecepcion}`)
        .send({ tipo: 'permiso', fechaDesde: '2026-11-01', fechaHasta: '2026-11-01' });

      const res = await request(app)
        .delete(`/staff/ausencias/${crear.body.id}`)
        .set('Authorization', `Bearer ${tokenRecepcion}`);
      expect(res.status).toBe(204);
    });
  });
});

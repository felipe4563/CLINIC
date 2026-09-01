const bcrypt = require('bcryptjs');
const db = require('./models');

async function seed() {
  await db.sequelize.sync();

  const [adminRol] = await db.Rol.findOrCreate({ where: { nombre: 'Admin' } });
  await db.Rol.findOrCreate({ where: { nombre: 'Recepcion' } });
  await db.Rol.findOrCreate({ where: { nombre: 'Profesional' } });

  const passwordHash = await bcrypt.hash('changeme123', 10);
  await db.Usuario.findOrCreate({
    where: { email: 'admin@clinicnovaged.com' },
    defaults: { nombre: 'Admin', password_hash: passwordHash, rol_id: adminRol.id },
  });

  const [profesional] = await db.Profesional.findOrCreate({
    where: { nombre: 'Dra. Ejemplo' },
    defaults: { especialidad: 'Medicina General', activo: true },
  });

  const [servicio] = await db.Servicio.findOrCreate({
    where: { nombre: 'Consulta general' },
    defaults: { duracion_min: 30, precio: 100, activo: true },
  });

  await db.ServicioProfesional.findOrCreate({
    where: { servicio_id: servicio.id, profesional_id: profesional.id },
  });

  for (let dia = 1; dia <= 5; dia++) {
    await db.HorarioDisponible.findOrCreate({
      where: { profesional_id: profesional.id, dia_semana: dia },
      defaults: { hora_inicio: '09:00:00', hora_fin: '17:00:00' },
    });
  }

  console.log('Seed completo.');
  await db.sequelize.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

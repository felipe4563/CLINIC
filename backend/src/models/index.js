const sequelize = require('../config/database');
const Paciente = require('./paciente');
const OtpCode = require('./otpCode');
const Rol = require('./rol');
const Usuario = require('./usuario');
const Profesional = require('./profesional');
const Servicio = require('./servicio');
const ServicioProfesional = require('./servicioProfesional');
const HorarioDisponible = require('./horarioDisponible');
const Cita = require('./cita');
const Pago = require('./pago');

Rol.hasMany(Usuario, { foreignKey: 'rol_id' });
Usuario.belongsTo(Rol, { foreignKey: 'rol_id' });

Usuario.hasOne(Profesional, { foreignKey: 'usuario_id' });
Profesional.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Servicio.belongsToMany(Profesional, { through: ServicioProfesional, foreignKey: 'servicio_id' });
Profesional.belongsToMany(Servicio, { through: ServicioProfesional, foreignKey: 'profesional_id' });

Profesional.hasMany(HorarioDisponible, { foreignKey: 'profesional_id' });
HorarioDisponible.belongsTo(Profesional, { foreignKey: 'profesional_id' });

Paciente.hasMany(Cita, { foreignKey: 'paciente_id' });
Cita.belongsTo(Paciente, { foreignKey: 'paciente_id' });

Profesional.hasMany(Cita, { foreignKey: 'profesional_id' });
Cita.belongsTo(Profesional, { foreignKey: 'profesional_id' });

Servicio.hasMany(Cita, { foreignKey: 'servicio_id' });
Cita.belongsTo(Servicio, { foreignKey: 'servicio_id' });

Cita.hasOne(Pago, { foreignKey: 'cita_id' });
Pago.belongsTo(Cita, { foreignKey: 'cita_id', as: 'Cita' });

module.exports = {
  sequelize,
  Paciente,
  OtpCode,
  Rol,
  Usuario,
  Profesional,
  Servicio,
  ServicioProfesional,
  HorarioDisponible,
  Cita,
  Pago,
};

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
const NotaClinica = require('./notaClinica');
const MovimientoCaja = require('./movimientoCaja');
const Producto = require('./producto');
const ActivoClinica = require('./activoClinica');
const Venta = require('./venta');
const VentaItem = require('./ventaItem');
const Marca = require('./marca');
const CategoriaProducto = require('./categoriaProducto');
const ServicioProducto = require('./servicioProducto');
const NotificacionAutomatica = require('./notificacionAutomatica');
const AutomatizacionConfig = require('./automatizacionConfig');
const RegistroAsistencia = require('./registroAsistencia');
const Ausencia = require('./ausencia');
const ConfiguracionClinica = require('./configuracionClinica');

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

NotaClinica.belongsTo(Paciente, { foreignKey: { name: 'paciente_id', allowNull: false } });
Paciente.hasMany(NotaClinica, { foreignKey: 'paciente_id' });

NotaClinica.belongsTo(Profesional, { foreignKey: { name: 'profesional_id', allowNull: true } });
Profesional.hasMany(NotaClinica, { foreignKey: 'profesional_id' });

NotaClinica.belongsTo(Cita, { foreignKey: { name: 'cita_id', allowNull: true } });
Cita.hasOne(NotaClinica, { foreignKey: 'cita_id' });

MovimientoCaja.belongsTo(Usuario, { foreignKey: { name: 'usuario_id', allowNull: false } });
Usuario.hasMany(MovimientoCaja, { foreignKey: 'usuario_id' });

MovimientoCaja.belongsTo(Pago, { foreignKey: { name: 'pago_id', allowNull: true } });
Pago.hasOne(MovimientoCaja, { foreignKey: 'pago_id' });

Venta.belongsTo(Usuario, { foreignKey: { name: 'usuario_id', allowNull: false } });
Usuario.hasMany(Venta, { foreignKey: 'usuario_id' });

Venta.belongsTo(Paciente, { foreignKey: { name: 'paciente_id', allowNull: true } });
Paciente.hasMany(Venta, { foreignKey: 'paciente_id' });

Venta.hasMany(VentaItem, { foreignKey: { name: 'venta_id', allowNull: false } });
VentaItem.belongsTo(Venta, { foreignKey: 'venta_id' });

VentaItem.belongsTo(Producto, { foreignKey: { name: 'producto_id', allowNull: false } });
Producto.hasMany(VentaItem, { foreignKey: 'producto_id' });

MovimientoCaja.belongsTo(Venta, { foreignKey: { name: 'venta_id', allowNull: true } });
Venta.hasOne(MovimientoCaja, { foreignKey: 'venta_id' });

Producto.belongsTo(Marca, { foreignKey: { name: 'marca_id', allowNull: true } });
Marca.hasMany(Producto, { foreignKey: 'marca_id' });

Producto.belongsTo(CategoriaProducto, { foreignKey: { name: 'categoria_id', allowNull: true } });
CategoriaProducto.hasMany(Producto, { foreignKey: 'categoria_id' });

Servicio.belongsToMany(Producto, { through: ServicioProducto, foreignKey: 'servicio_id' });
Producto.belongsToMany(Servicio, { through: ServicioProducto, foreignKey: 'producto_id' });

NotificacionAutomatica.belongsTo(Cita, { foreignKey: { name: 'cita_id', allowNull: true } });
Cita.hasMany(NotificacionAutomatica, { foreignKey: 'cita_id' });

NotificacionAutomatica.belongsTo(Pago, { foreignKey: { name: 'pago_id', allowNull: true } });
Pago.hasMany(NotificacionAutomatica, { foreignKey: 'pago_id' });

RegistroAsistencia.belongsTo(Usuario, { foreignKey: { name: 'usuario_id', allowNull: false } });
Usuario.hasMany(RegistroAsistencia, { foreignKey: 'usuario_id' });

Ausencia.belongsTo(Usuario, { foreignKey: { name: 'usuario_id', allowNull: false } });
Usuario.hasMany(Ausencia, { foreignKey: 'usuario_id' });

Ausencia.belongsTo(Usuario, { foreignKey: { name: 'aprobado_por_id', allowNull: true }, as: 'AprobadoPor' });

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
  NotaClinica,
  MovimientoCaja,
  Producto,
  ActivoClinica,
  Venta,
  VentaItem,
  Marca,
  CategoriaProducto,
  ServicioProducto,
  NotificacionAutomatica,
  AutomatizacionConfig,
  RegistroAsistencia,
  Ausencia,
  ConfiguracionClinica,
};

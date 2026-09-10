const MODULOS = [
  { clave: 'dashboard', etiqueta: 'Dashboard', descripcion: 'Ver métricas generales de la clínica' },
  { clave: 'agenda', etiqueta: 'Agenda', descripcion: 'Ver y gestionar citas' },
  { clave: 'pacientes', etiqueta: 'Pacientes', descripcion: 'Ver, crear, editar y eliminar pacientes' },
  { clave: 'catalogo', etiqueta: 'Catálogo', descripcion: 'Gestionar servicios y profesionales' },
  { clave: 'usuarios', etiqueta: 'Usuarios y roles', descripcion: 'Gestionar usuarios internos, roles y permisos' },
  { clave: 'caja', etiqueta: 'Caja', descripcion: 'Registrar ingresos y egresos de efectivo, y ver el cierre de caja del día' },
  { clave: 'inventario', etiqueta: 'Inventario', descripcion: 'Gestionar productos y activos de la clínica' },
  { clave: 'ventas', etiqueta: 'Ventas (POS)', descripcion: 'Vender productos en el punto de venta' },
  {
    clave: 'automatizacion',
    etiqueta: 'Automatización',
    descripcion: 'Configurar recordatorios y mensajes automáticos por WhatsApp, y ver el registro de envíos',
  },
  {
    clave: 'personal',
    etiqueta: 'Control de Personal',
    descripcion: 'Ver la asistencia y gestionar permisos/faltas de todo el personal',
  },
  {
    clave: 'configuracion',
    etiqueta: 'Configuración',
    descripcion: 'Editar los datos del consultorio usados en reportes y exportaciones',
  },
  {
    clave: 'reportes',
    etiqueta: 'Reportes',
    descripcion: 'Ver y exportar en PDF los reportes financieros, de citas, pacientes, ventas y personal',
  },
];

const CLAVES_VALIDAS = MODULOS.map((m) => m.clave);

const PERMISOS_POR_DEFECTO = {
  Admin: ['dashboard', 'agenda', 'pacientes', 'catalogo', 'usuarios', 'caja', 'inventario', 'ventas', 'automatizacion', 'personal', 'configuracion', 'reportes'],
  Recepcion: ['dashboard', 'agenda', 'pacientes', 'caja', 'inventario', 'ventas'],
  Profesional: ['dashboard', 'agenda', 'pacientes'],
};

module.exports = { MODULOS, CLAVES_VALIDAS, PERMISOS_POR_DEFECTO };

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const TOKEN_KEY = 'novaged_staff_token';
const USER_KEY = 'novaged_staff_usuario';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const esFormData = options.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(esFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function descargarPDF(path) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="([^"]+)"/);
  const nombreArchivo = match ? match[1] : 'reporte.pdf';

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  login: (email, password) =>
    apiFetch('/staff/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  getDashboard: (periodo) => apiFetch(`/staff/dashboard?periodo=${periodo}`),

  getCitas: (fecha, profesionalId) => {
    const params = new URLSearchParams();
    if (fecha) params.set('fecha', fecha);
    if (profesionalId) params.set('profesionalId', profesionalId);
    return apiFetch(`/staff/citas?${params.toString()}`);
  },
  getCitasRango: (desde, hasta, profesionalId) => {
    const params = new URLSearchParams({ desde, hasta });
    if (profesionalId) params.set('profesionalId', profesionalId);
    return apiFetch(`/staff/citas?${params.toString()}`);
  },
  actualizarEstadoCita: (id, estado) =>
    apiFetch(`/staff/citas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),
  crearCita: (datos) => apiFetch('/staff/citas', { method: 'POST', body: JSON.stringify(datos) }),
  descargarAgendaPDF: (fecha, profesionalId) => {
    const params = new URLSearchParams();
    if (fecha) params.set('fecha', fecha);
    if (profesionalId) params.set('profesionalId', profesionalId);
    return descargarPDF(`/staff/agenda/pdf?${params.toString()}`);
  },

  getPacientes: (q) => apiFetch(`/staff/pacientes${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getPaciente: (id) => apiFetch(`/staff/pacientes/${id}`),
  crearPaciente: (datos) => apiFetch('/staff/pacientes', { method: 'POST', body: JSON.stringify(datos) }),
  actualizarPaciente: (id, datos) =>
    apiFetch(`/staff/pacientes/${id}`, { method: 'PATCH', body: JSON.stringify(datos) }),
  eliminarPaciente: (id) => apiFetch(`/staff/pacientes/${id}`, { method: 'DELETE' }),

  getSaldosPendientes: () => apiFetch('/staff/saldos-pendientes'),
  marcarSaldoEfectivo: (pagoId) => apiFetch(`/staff/pagos/${pagoId}/saldo`, { method: 'PATCH' }),
  generarQRSaldo: (pagoId) => apiFetch(`/staff/pagos/${pagoId}/saldo/qr`, { method: 'POST' }),
  estadoSaldoQR: (pagoId) => apiFetch(`/staff/pagos/${pagoId}/saldo/estado`),

  getTratamientos: (q) => apiFetch(`/staff/tratamientos${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getTratamientosPaciente: (pacienteId) => apiFetch(`/staff/pacientes/${pacienteId}/tratamientos`),
  crearTratamiento: (pacienteId, datos) =>
    apiFetch(`/staff/pacientes/${pacienteId}/tratamientos`, { method: 'POST', body: JSON.stringify(datos) }),
  actualizarTratamiento: (id, datos) =>
    apiFetch(`/staff/tratamientos/${id}`, { method: 'PATCH', body: JSON.stringify(datos) }),
  eliminarTratamiento: (id) => apiFetch(`/staff/tratamientos/${id}`, { method: 'DELETE' }),

  getCaja: (fecha) => apiFetch(`/staff/caja${fecha ? `?fecha=${fecha}` : ''}`),
  crearMovimientoCaja: (datos) => apiFetch('/staff/caja', { method: 'POST', body: JSON.stringify(datos) }),
  eliminarMovimientoCaja: (id) => apiFetch(`/staff/caja/${id}`, { method: 'DELETE' }),

  getProductos: (q) => apiFetch(`/staff/productos${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  crearProducto: (datos) => apiFetch('/staff/productos', { method: 'POST', body: JSON.stringify(datos) }),
  actualizarProducto: (id, datos) => apiFetch(`/staff/productos/${id}`, { method: 'PATCH', body: JSON.stringify(datos) }),
  eliminarProducto: (id) => apiFetch(`/staff/productos/${id}`, { method: 'DELETE' }),

  getMarcas: () => apiFetch('/staff/marcas'),
  crearMarca: (nombre) => apiFetch('/staff/marcas', { method: 'POST', body: JSON.stringify({ nombre }) }),
  eliminarMarca: (id) => apiFetch(`/staff/marcas/${id}`, { method: 'DELETE' }),

  getCategoriasProducto: () => apiFetch('/staff/categorias-producto'),
  crearCategoriaProducto: (nombre) => apiFetch('/staff/categorias-producto', { method: 'POST', body: JSON.stringify({ nombre }) }),
  eliminarCategoriaProducto: (id) => apiFetch(`/staff/categorias-producto/${id}`, { method: 'DELETE' }),

  vincularProducto: (servicioId, productoId) =>
    apiFetch(`/staff/servicios/${servicioId}/productos`, { method: 'POST', body: JSON.stringify({ productoId }) }),
  desvincularProducto: (servicioId, productoId) =>
    apiFetch(`/staff/servicios/${servicioId}/productos/${productoId}`, { method: 'DELETE' }),

  getActivos: (q) => apiFetch(`/staff/activos${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  crearActivo: (datos) => apiFetch('/staff/activos', { method: 'POST', body: JSON.stringify(datos) }),
  actualizarActivo: (id, datos) => apiFetch(`/staff/activos/${id}`, { method: 'PATCH', body: JSON.stringify(datos) }),
  darDeBajaActivo: (id, motivo) => apiFetch(`/staff/activos/${id}/baja`, { method: 'POST', body: JSON.stringify({ motivo }) }),
  eliminarActivo: (id) => apiFetch(`/staff/activos/${id}`, { method: 'DELETE' }),

  getVentas: (fecha) => apiFetch(`/staff/ventas${fecha ? `?fecha=${fecha}` : ''}`),
  crearVenta: (datos) => apiFetch('/staff/ventas', { method: 'POST', body: JSON.stringify(datos) }),
  estadoVentaQR: (id) => apiFetch(`/staff/ventas/${id}/estado`),
  cancelarVenta: (id) => apiFetch(`/staff/ventas/${id}`, { method: 'DELETE' }),

  getAutomatizacion: () => apiFetch('/staff/automatizacion'),
  actualizarAutomatizacion: (datos) =>
    apiFetch('/staff/automatizacion', { method: 'PATCH', body: JSON.stringify(datos) }),

  getAsistenciaHoy: () => apiFetch('/staff/asistencia/hoy'),
  marcarAsistencia: () => apiFetch('/staff/asistencia/marcar', { method: 'POST' }),
  getAsistencia: (params = {}) => {
    const qs = new URLSearchParams(params);
    return apiFetch(`/staff/asistencia${qs.toString() ? `?${qs.toString()}` : ''}`);
  },
  actualizarAsistencia: (id, datos) =>
    apiFetch(`/staff/asistencia/${id}`, { method: 'PATCH', body: JSON.stringify(datos) }),
  eliminarAsistencia: (id) => apiFetch(`/staff/asistencia/${id}`, { method: 'DELETE' }),

  getMisAusencias: () => apiFetch('/staff/ausencias/mias'),
  solicitarAusencia: (datos) => apiFetch('/staff/ausencias', { method: 'POST', body: JSON.stringify(datos) }),
  eliminarAusencia: (id) => apiFetch(`/staff/ausencias/${id}`, { method: 'DELETE' }),
  getAusencias: (params = {}) => {
    const qs = new URLSearchParams(params);
    return apiFetch(`/staff/ausencias${qs.toString() ? `?${qs.toString()}` : ''}`);
  },
  registrarAusencia: (datos) => apiFetch('/staff/ausencias/registrar', { method: 'POST', body: JSON.stringify(datos) }),
  actualizarEstadoAusencia: (id, estado) =>
    apiFetch(`/staff/ausencias/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),

  getConfiguracion: () => apiFetch('/staff/configuracion'),
  actualizarConfiguracion: (datos) =>
    apiFetch('/staff/configuracion', { method: 'PUT', body: JSON.stringify(datos) }),
  subirLogoConfiguracion: (archivo) => {
    const formData = new FormData();
    formData.append('logo', archivo);
    return apiFetch('/staff/configuracion/logo', { method: 'POST', body: formData });
  },
  eliminarLogoConfiguracion: () => apiFetch('/staff/configuracion/logo', { method: 'DELETE' }),

  getReporte: (tipo, params = {}) => {
    const qs = new URLSearchParams(params);
    return apiFetch(`/staff/reportes/${tipo}${qs.toString() ? `?${qs.toString()}` : ''}`);
  },
  descargarReportePDF: (tipo, params = {}) => {
    const qs = new URLSearchParams(params);
    return descargarPDF(`/staff/reportes/${tipo}/pdf${qs.toString() ? `?${qs.toString()}` : ''}`);
  },

  getServiciosPublico: () => apiFetch('/servicios'),
  getProfesionalesPublico: (servicioId) =>
    apiFetch(`/profesionales${servicioId ? `?servicioId=${servicioId}` : ''}`),
  getDisponibilidad: (profesionalId, servicioId, fecha) =>
    apiFetch(`/disponibilidad?profesionalId=${profesionalId}&servicioId=${servicioId}&fecha=${fecha}`),

  getServiciosStaff: () => apiFetch('/staff/servicios'),
  crearServicio: (datos) => apiFetch('/staff/servicios', { method: 'POST', body: JSON.stringify(datos) }),
  actualizarServicio: (id, datos) =>
    apiFetch(`/staff/servicios/${id}`, { method: 'PATCH', body: JSON.stringify(datos) }),

  getProfesionalesStaff: () => apiFetch('/staff/profesionales'),
  crearProfesional: (datos) => apiFetch('/staff/profesionales', { method: 'POST', body: JSON.stringify(datos) }),
  actualizarProfesional: (id, datos) =>
    apiFetch(`/staff/profesionales/${id}`, { method: 'PATCH', body: JSON.stringify(datos) }),
  vincularServicio: (profesionalId, servicioId) =>
    apiFetch(`/staff/profesionales/${profesionalId}/servicios`, {
      method: 'POST',
      body: JSON.stringify({ servicioId }),
    }),
  desvincularServicio: (profesionalId, servicioId) =>
    apiFetch(`/staff/profesionales/${profesionalId}/servicios/${servicioId}`, { method: 'DELETE' }),
  getHorarios: (profesionalId) => apiFetch(`/staff/profesionales/${profesionalId}/horarios`),
  crearHorario: (profesionalId, datos) =>
    apiFetch(`/staff/profesionales/${profesionalId}/horarios`, { method: 'POST', body: JSON.stringify(datos) }),
  eliminarHorario: (id) => apiFetch(`/staff/horarios/${id}`, { method: 'DELETE' }),

  getUsuarios: () => apiFetch('/staff/usuarios'),
  crearUsuario: (datos) => apiFetch('/staff/usuarios', { method: 'POST', body: JSON.stringify(datos) }),
  actualizarUsuario: (id, datos) =>
    apiFetch(`/staff/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(datos) }),
  eliminarUsuario: (id) => apiFetch(`/staff/usuarios/${id}`, { method: 'DELETE' }),

  getRoles: () => apiFetch('/staff/roles'),
  crearRol: (datos) => apiFetch('/staff/roles', { method: 'POST', body: JSON.stringify(datos) }),
  actualizarRol: (id, datos) => apiFetch(`/staff/roles/${id}`, { method: 'PATCH', body: JSON.stringify(datos) }),
  eliminarRol: (id) => apiFetch(`/staff/roles/${id}`, { method: 'DELETE' }),
  getPermisosDisponibles: () => apiFetch('/staff/permisos-disponibles'),

  setSession: (token, usuario) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  },
  getUsuarioActual: () => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isLoggedIn: () => Boolean(getToken()),
};

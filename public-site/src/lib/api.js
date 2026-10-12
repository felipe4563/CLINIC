const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('novaged_token');
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
    const error = new Error(body.error || `Error ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export const api = {
  getConfiguracionPublica: () => apiFetch('/configuracion-publica'),
  getServicios: () => apiFetch('/servicios'),
  getProfesionales: (servicioId) => apiFetch(`/profesionales?servicioId=${servicioId}`),
  getDisponibilidad: (profesionalId, servicioId, fecha) =>
    apiFetch(`/disponibilidad?profesionalId=${profesionalId}&servicioId=${servicioId}&fecha=${fecha}`),
  registro: (telefono, nombre_completo, carnet_identidad, carnet_complemento, carnet_expedido) =>
    apiFetch('/auth/registro', {
      method: 'POST',
      body: JSON.stringify({ telefono, nombre_completo, carnet_identidad, carnet_complemento, carnet_expedido }),
    }),
  loginConCodigo: (codigo_paciente, telefono) =>
    apiFetch('/auth/codigo/login', { method: 'POST', body: JSON.stringify({ codigo_paciente, telefono }) }),
  crearCita: (profesionalId, servicioId, fecha, horaInicio, porcentajePago, aceptaPolitica) =>
    apiFetch('/citas', {
      method: 'POST',
      body: JSON.stringify({ profesionalId, servicioId, fecha, horaInicio, porcentajePago, aceptaPolitica }),
    }),
  crearCitaConComprobante: ({ profesionalId, servicioId, fecha, horaInicio, porcentajePago }, archivo) => {
    const datos = new FormData();
    datos.append('profesionalId', String(profesionalId));
    datos.append('servicioId', String(servicioId));
    datos.append('fecha', fecha);
    datos.append('horaInicio', horaInicio);
    datos.append('porcentajePago', String(porcentajePago));
    datos.append('aceptaPolitica', 'true');
    datos.append('comprobante', archivo);
    return apiFetch('/citas', { method: 'POST', body: datos });
  },
  misCitas: () => apiFetch('/citas/mias'),
  generarQR: (citaId) => apiFetch(`/pagos/${citaId}/qr`, { method: 'POST' }),
  estadoPago: (citaId) => apiFetch(`/pagos/${citaId}/estado`),
  setToken: (token) => localStorage.setItem('novaged_token', token),
  isLoggedIn: () => Boolean(getToken()),
};

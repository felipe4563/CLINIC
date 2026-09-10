const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('novaged_token');
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.json();
}

export const api = {
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
  crearCita: (profesionalId, servicioId, fecha, horaInicio, porcentajePago) =>
    apiFetch('/citas', {
      method: 'POST',
      body: JSON.stringify({ profesionalId, servicioId, fecha, horaInicio, porcentajePago }),
    }),
  misCitas: () => apiFetch('/citas/mias'),
  generarQR: (citaId) => apiFetch(`/pagos/${citaId}/qr`, { method: 'POST' }),
  estadoPago: (citaId) => apiFetch(`/pagos/${citaId}/estado`),
  setToken: (token) => localStorage.setItem('novaged_token', token),
  isLoggedIn: () => Boolean(getToken()),
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
  requestOtp: (telefono, nombre_completo) =>
    apiFetch('/auth/otp/request', { method: 'POST', body: JSON.stringify({ telefono, nombre_completo }) }),
  verifyOtp: (telefono, codigo) =>
    apiFetch('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ telefono, codigo }) }),
  crearCita: (profesionalId, servicioId, fecha, horaInicio) =>
    apiFetch('/citas', { method: 'POST', body: JSON.stringify({ profesionalId, servicioId, fecha, horaInicio }) }),
  misCitas: () => apiFetch('/citas/mias'),
  generarQR: (citaId) => apiFetch(`/pagos/${citaId}/qr`, { method: 'POST' }),
  setToken: (token) => localStorage.setItem('novaged_token', token),
  isLoggedIn: () => Boolean(getToken()),
};

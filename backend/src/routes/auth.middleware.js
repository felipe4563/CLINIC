const jwt = require('jsonwebtoken');

function requirePaciente(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.pacienteId = payload.pacienteId;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalido' });
  }
}

function requireStaff(...rolesPermitidos) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No autenticado' });
    try {
      const payload = jwt.verify(token, process.env.JWT_STAFF_SECRET);
      if (rolesPermitidos.length && !rolesPermitidos.includes(payload.rolNombre)) {
        return res.status(403).json({ error: 'No autorizado para este recurso' });
      }
      req.usuarioId = payload.usuarioId;
      req.rolNombre = payload.rolNombre;
      req.permisos = payload.permisos || [];
      next();
    } catch {
      return res.status(401).json({ error: 'Token invalido' });
    }
  };
}

// Basta con tener uno de los permisos (p. ej. los productos los usan Ventas e Inventario).
function requirePermiso(clave) {
  const claves = Array.isArray(clave) ? clave : [clave];
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No autenticado' });
    try {
      const payload = jwt.verify(token, process.env.JWT_STAFF_SECRET);
      const permisos = payload.permisos || [];
      if (!claves.some((c) => permisos.includes(c))) {
        return res.status(403).json({ error: 'No autorizado para este recurso' });
      }
      req.usuarioId = payload.usuarioId;
      req.rolNombre = payload.rolNombre;
      req.permisos = permisos;
      next();
    } catch {
      return res.status(401).json({ error: 'Token invalido' });
    }
  };
}

module.exports = { requirePaciente, requireStaff, requirePermiso };

// Comprobantes de pago y justificaciones: tienen datos bancarios y
// personales, así que viven FUERA de /uploads (que es público) y solo se
// leen por rutas del personal con sesión.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const MAX_BYTES = 5 * 1024 * 1024;
const MENSAJE_FORMATO = 'Sube una imagen (JPG, PNG o WebP) o un PDF de hasta 5 MB';
const CARPETAS = ['comprobantes', 'justificaciones'];
const MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MIME_POR_EXT = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.pdf': 'application/pdf' };
const FIRMA_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function directorioBase() {
  // res.sendFile exige ruta absoluta: resolvemos por si PRIVADO_DIR es relativa.
  return path.resolve(process.env.PRIVADO_DIR || path.join(__dirname, '..', '..', 'privado'));
}

// El tipo MIME lo declara el navegador y se puede falsear: lo que manda es
// la firma (bytes iniciales) del contenido.
function detectarTipo(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { ext: '.jpg', mime: 'image/jpeg' };
  if (buffer.subarray(0, 8).equals(FIRMA_PNG)) return { ext: '.png', mime: 'image/png' };
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return { ext: '.webp', mime: 'image/webp' };
  if (buffer.toString('ascii', 0, 5) === '%PDF-') return { ext: '.pdf', mime: 'application/pdf' };
  return null;
}

// En memoria: el archivo se escribe a disco solo después de validar todo
// (formato, horario libre), así nunca quedan archivos huérfanos.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!MIME_PERMITIDOS.includes(file.mimetype)) return cb(new Error(MENSAJE_FORMATO));
    cb(null, true);
  },
});

function recibirArchivo(campo) {
  const single = upload.single(campo);
  return (req, res, next) => {
    if (!req.is('multipart/form-data')) return next();
    single(req, res, (err) => {
      if (err) return res.status(400).json({ error: MENSAJE_FORMATO });
      if (req.file && !detectarTipo(req.file.buffer)) return res.status(400).json({ error: MENSAJE_FORMATO });
      next();
    });
  };
}

function rutaArchivo(carpeta, nombre) {
  if (!CARPETAS.includes(carpeta)) throw new Error(`Carpeta privada desconocida: ${carpeta}`);
  return path.join(directorioBase(), carpeta, path.basename(String(nombre)));
}

async function guardarArchivoPrivado(carpeta, buffer) {
  rutaArchivo(carpeta, 'x');
  const tipo = detectarTipo(buffer);
  if (!tipo) throw new Error(MENSAJE_FORMATO);
  const dir = path.join(directorioBase(), carpeta);
  await fs.promises.mkdir(dir, { recursive: true });
  const nombre = `${crypto.randomUUID()}${tipo.ext}`;
  await fs.promises.writeFile(path.join(dir, nombre), buffer);
  return nombre;
}

async function borrarArchivoPrivado(carpeta, nombre) {
  if (!nombre) return;
  await fs.promises.unlink(rutaArchivo(carpeta, nombre)).catch(() => {});
}

function enviarArchivoPrivado(res, carpeta, nombre) {
  const ruta = nombre ? rutaArchivo(carpeta, nombre) : null;
  if (!ruta || !fs.existsSync(ruta)) return res.status(404).json({ error: 'Archivo no encontrado' });
  res.set('Content-Type', MIME_POR_EXT[path.extname(ruta)] || 'application/octet-stream');
  res.set('Content-Disposition', 'inline');
  res.set('Cache-Control', 'private, no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  return res.sendFile(ruta);
}

module.exports = {
  MAX_BYTES,
  MENSAJE_FORMATO,
  detectarTipo,
  recibirArchivo,
  guardarArchivoPrivado,
  borrarArchivoPrivado,
  enviarArchivoPrivado,
};

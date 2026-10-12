const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');

process.env.PRIVADO_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'privado-'));

const {
  MENSAJE_FORMATO,
  detectarTipo,
  recibirArchivo,
  guardarArchivoPrivado,
  borrarArchivoPrivado,
  enviarArchivoPrivado,
} = require('../src/services/archivosPrivados');
const { pngFalso, pdfFalso, exeFalso, pngGrande } = require('./helpers/archivos');

function appDePrueba() {
  const app = express();
  app.post('/subir', recibirArchivo('archivo'), (req, res) => {
    res.json({ recibido: Boolean(req.file), bytes: req.file ? req.file.size : 0 });
  });
  return app;
}

afterAll(() => {
  fs.rmSync(process.env.PRIVADO_DIR, { recursive: true, force: true });
});

describe('detectarTipo', () => {
  test('reconoce PNG, JPG, WebP y PDF por su firma', () => {
    expect(detectarTipo(pngFalso())).toEqual({ ext: '.png', mime: 'image/png' });
    expect(detectarTipo(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16)]))).toEqual({ ext: '.jpg', mime: 'image/jpeg' });
    expect(detectarTipo(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(8)]))).toEqual({ ext: '.webp', mime: 'image/webp' });
    expect(detectarTipo(pdfFalso())).toEqual({ ext: '.pdf', mime: 'application/pdf' });
  });

  test('rechaza un ejecutable, texto plano y buffers vacíos', () => {
    expect(detectarTipo(exeFalso())).toBeNull();
    expect(detectarTipo(Buffer.from('hola, no soy una imagen'))).toBeNull();
    expect(detectarTipo(Buffer.alloc(0))).toBeNull();
  });
});

describe('recibirArchivo', () => {
  test('acepta un PNG real', async () => {
    const res = await request(appDePrueba()).post('/subir').attach('archivo', pngFalso(), { filename: 'c.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.recibido).toBe(true);
  });

  test('rechaza un .exe disfrazado de .jpg', async () => {
    const res = await request(appDePrueba()).post('/subir').attach('archivo', exeFalso(), { filename: 'c.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(MENSAJE_FORMATO);
  });

  test('rechaza un tipo MIME no permitido', async () => {
    const res = await request(appDePrueba()).post('/subir').attach('archivo', Buffer.from('a,b'), { filename: 'c.csv', contentType: 'text/csv' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(MENSAJE_FORMATO);
  });

  test('rechaza más de 5 MB con 400, no 500', async () => {
    const res = await request(appDePrueba()).post('/subir').attach('archivo', pngGrande(), { filename: 'g.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(MENSAJE_FORMATO);
  });

  test('deja pasar una petición JSON sin archivo', async () => {
    const res = await request(appDePrueba()).post('/subir').send({ a: 1 });
    expect(res.status).toBe(200);
    expect(res.body.recibido).toBe(false);
  });
});

describe('guardar, enviar y borrar', () => {
  test('guarda con nombre aleatorio dentro de PRIVADO_DIR y lo sirve con cabeceras seguras', async () => {
    const nombre = await guardarArchivoPrivado('comprobantes', pngFalso());
    expect(nombre).toMatch(/^[0-9a-f-]{36}\.png$/);
    const ruta = path.join(process.env.PRIVADO_DIR, 'comprobantes', nombre);
    expect(fs.existsSync(ruta)).toBe(true);

    const app = express();
    app.get('/ver/:nombre', (req, res) => enviarArchivoPrivado(res, 'comprobantes', req.params.nombre));
    const res = await request(app).get(`/ver/${nombre}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.headers['content-disposition']).toBe('inline');
    expect(res.headers['x-content-type-options']).toBe('nosniff');

    await borrarArchivoPrivado('comprobantes', nombre);
    expect(fs.existsSync(ruta)).toBe(false);
  });

  test('no sale de su carpeta con ../', async () => {
    const app = express();
    app.get('/ver', (req, res) => enviarArchivoPrivado(res, 'comprobantes', '../../etc/passwd'));
    const res = await request(app).get('/ver');
    expect(res.status).toBe(404);
  });

  test('rechaza carpetas desconocidas y contenido inválido', async () => {
    await expect(guardarArchivoPrivado('otra', pngFalso())).rejects.toThrow('Carpeta privada desconocida');
    await expect(guardarArchivoPrivado('comprobantes', exeFalso())).rejects.toThrow(MENSAJE_FORMATO);
  });

  test('borrar un nombre nulo no falla', async () => {
    await expect(borrarArchivoPrivado('comprobantes', null)).resolves.toBeUndefined();
  });
});

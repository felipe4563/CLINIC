const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

function rutaLogoEmbebible(logoUrl) {
  if (!logoUrl || !logoUrl.startsWith('/uploads/')) return null;
  if (!/\.(png|jpe?g)$/i.test(logoUrl)) return null; // pdfkit solo soporta PNG/JPEG
  const ruta = path.join(UPLOADS_DIR, logoUrl.replace('/uploads/', ''));
  return fs.existsSync(ruta) ? ruta : null;
}

function formatoMoneda(n) {
  return `Bs ${Number(n).toFixed(2)}`;
}

function formatoFecha(iso) {
  if (!iso) return '';
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

function crearReportePDF(res, config, { titulo, nombreArchivo, desde, hasta }) {
  const doc = new PDFDocument({ size: 'A4', margin: 48 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
  doc.pipe(res);

  const logoPath = rutaLogoEmbebible(config.logo_url);
  if (logoPath) {
    try {
      const tamano = 50;
      doc.image(logoPath, doc.page.width - doc.page.margins.right - tamano, doc.page.margins.top, {
        fit: [tamano, tamano],
      });
    } catch {
      // Archivo de logo inválido o corrupto: se omite sin interrumpir el reporte.
    }
  }

  doc.font('Helvetica-Bold').fontSize(16).fillColor('#1a1a1a').text(config.nombre_consultorio || 'Clínica', { continued: false });
  doc.font('Helvetica').fontSize(9).fillColor('#555555');
  const lineas = [config.direccion, [config.ciudad, config.pais].filter(Boolean).join(', '), config.telefono, config.email, config.nit ? `NIT: ${config.nit}` : null]
    .filter(Boolean);
  lineas.forEach((linea) => doc.text(linea));

  doc.moveDown(0.5);
  doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor('#dddddd').stroke();
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').fontSize(14).fillColor('#1a1a1a').text(titulo);
  if (desde && hasta) {
    doc.font('Helvetica').fontSize(10).fillColor('#555555').text(`Periodo: ${formatoFecha(desde)} — ${formatoFecha(hasta)}`);
  }
  doc.font('Helvetica').fontSize(8).fillColor('#999999').text(`Generado el ${new Date().toLocaleString('es-BO')}`);
  doc.moveDown(1);
  doc.fillColor('#1a1a1a');

  const piePagina = config.pie_pdf;
  if (piePagina) {
    doc.on('pageAdded', () => dibujarPie());
    dibujarPie();
  }

  function dibujarPie() {
    const y = doc.page.height - doc.page.margins.bottom + 15;
    doc.font('Helvetica').fontSize(8).fillColor('#999999').text(piePagina, doc.page.margins.left, y, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      align: 'center',
    });
    doc.fillColor('#1a1a1a');
  }

  return doc;
}

function dibujarTabla(doc, { columnas, filas, anchoTotal }) {
  const inicioX = doc.page.margins.left;
  const ancho = anchoTotal || doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const pesos = columnas.map((c) => c.ancho || 1);
  const sumaPesos = pesos.reduce((a, b) => a + b, 0);
  const anchoColumna = pesos.map((p) => (p / sumaPesos) * ancho);

  function fila(valores, { negrita = false, fondo = null } = {}) {
    const alturaFila = 20;
    if (doc.y + alturaFila > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }
    const y = doc.y;
    if (fondo) {
      doc.rect(inicioX, y, ancho, alturaFila).fill(fondo);
      doc.fillColor('#1a1a1a');
    }
    doc.font(negrita ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
    let x = inicioX;
    valores.forEach((valor, i) => {
      doc.text(String(valor ?? ''), x + 4, y + 5, { width: anchoColumna[i] - 8, align: columnas[i].align || 'left' });
      x += anchoColumna[i];
    });
    doc.y = y + alturaFila;
  }

  fila(columnas.map((c) => c.titulo), { negrita: true, fondo: '#f0ede6' });
  if (filas.length === 0) {
    doc.font('Helvetica').fontSize(9).fillColor('#888888').text('Sin datos para este periodo.', inicioX, doc.y + 6);
    doc.moveDown(1);
    doc.fillColor('#1a1a1a');
    doc.x = inicioX;
    return;
  }
  filas.forEach((valores) => fila(valores));
  doc.moveDown(0.5);
  doc.x = inicioX;
}

module.exports = { crearReportePDF, dibujarTabla, formatoMoneda, formatoFecha };

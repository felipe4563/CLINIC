const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// Escala de grises para reportes en PDF (pensados para impresion B/N).
// Se mantienen los mismos nombres de token que antes (ink/tan/manhattan/...)
// para no tocar la logica de dibujo, solo los valores de color.
const COLOR = {
  ink: '#1A1A1A',
  espresso: '#333333',
  tan: '#4A4A4A',
  manhattan: '#B0B0B0',
  cream: '#F2F2F2',
  creamZebra: '#F7F7F7',
  white: '#FFFFFF',
  muted: '#5A5A5A',
  mutedLight: '#9A9A9A',
};

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

  const anchoPagina = doc.page.width;
  const margenIzq = doc.page.margins.left;
  const margenDer = doc.page.margins.right;
  const piePagina = config.pie_pdf;
  let numeroPagina = 1;

  function dibujarEncabezado() {
    const altoBanda = 92;

    doc.fillColor(COLOR.ink).font('Helvetica-Bold').fontSize(18).text(config.nombre_consultorio || 'Clínica', margenIzq, 22, {
      width: anchoPagina - margenIzq - margenDer - 80,
    });

    doc.font('Helvetica').fontSize(8.5).fillColor(COLOR.muted);
    const lineas = [config.direccion, [config.ciudad, config.pais].filter(Boolean).join(', '), [config.telefono, config.email].filter(Boolean).join('   ·   '), config.nit ? `NIT: ${config.nit}` : null]
      .filter(Boolean);
    let y = 46;
    lineas.forEach((linea) => {
      doc.text(linea, margenIzq, y, { width: anchoPagina - margenIzq - margenDer - 80 });
      y += 12;
    });

    const logoPath = rutaLogoEmbebible(config.logo_url);
    if (logoPath) {
      try {
        const tamano = 56;
        const x = anchoPagina - margenDer - tamano;
        const y2 = (altoBanda - tamano) / 2 - 8;
        doc.image(logoPath, x, y2, { fit: [tamano, tamano] });
      } catch {
        // Archivo de logo inválido o corrupto: se omite sin interrumpir el reporte.
      }
    }

    doc.moveTo(0, altoBanda).lineTo(anchoPagina, altoBanda).lineWidth(1.5).strokeColor(COLOR.ink).stroke();

    doc.y = altoBanda + 26;
    doc.fillColor(COLOR.ink);

    const yTitulo = doc.y;
    doc.rect(margenIzq, yTitulo + 2, 4, 16).fill(COLOR.tan);
    doc.font('Helvetica-Bold').fontSize(15).fillColor(COLOR.ink).text(titulo, margenIzq + 12, yTitulo);

    if (desde && hasta) {
      doc.font('Helvetica').fontSize(9.5).fillColor(COLOR.muted).text(`Periodo: ${formatoFecha(desde)} — ${formatoFecha(hasta)}`, margenIzq + 12);
    }
    doc.font('Helvetica-Oblique').fontSize(8).fillColor(COLOR.mutedLight).text(`Generado el ${new Date().toLocaleString('es-BO')}`, margenIzq + 12);

    doc.moveDown(0.8);
    doc.moveTo(margenIzq, doc.y).lineTo(anchoPagina - margenDer, doc.y).lineWidth(1.2).strokeColor(COLOR.manhattan).stroke();
    doc.moveDown(0.8);
    doc.fillColor(COLOR.ink);
    doc.x = margenIzq;
  }

  function dibujarPie() {
    // dibujarPie es un dibujo "de canal lateral" en el margen inferior: no
    // debe alterar la posicion del cursor (doc.x/doc.y) que el contenido
    // principal esta usando, asi que se guarda y se restaura.
    const xOriginal = doc.x;
    const yOriginal = doc.y;

    const y = doc.page.height - doc.page.margins.bottom + 14;
    // El pie vive dentro del margen inferior: si el margen se deja tal cual,
    // pdfkit considera cualquier .text() ahi como "desbordado" y dispara su
    // propia paginacion automatica (addPage -> pageAdded -> dibujarPie de
    // nuevo -> loop infinito). Se anula el margen mientras se dibuja el pie.
    const margenInferiorOriginal = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.moveTo(margenIzq, y - 6).lineTo(anchoPagina - margenDer, y - 6).lineWidth(0.6).strokeColor(COLOR.manhattan).stroke();
    doc.font('Helvetica').fontSize(7.5).fillColor(COLOR.mutedLight);
    if (piePagina) {
      doc.text(piePagina, margenIzq, y, { width: anchoPagina - margenIzq - margenDer - 60, align: 'left', lineBreak: false });
    }
    doc.text(`Página ${numeroPagina}`, anchoPagina - margenDer - 60, y, { width: 60, align: 'right', lineBreak: false });
    doc.fillColor(COLOR.ink);
    doc.page.margins.bottom = margenInferiorOriginal;

    doc.x = xOriginal;
    doc.y = yOriginal;
  }

  // El letterhead completo (banda de color, logo, título) solo se dibuja en la
  // primera página: redibujarlo dentro del evento 'pageAdded' hace que pdfkit
  // entre en recursión infinita (el texto se considera "desbordado" mientras
  // la nueva página aún se está inicializando y vuelve a llamar a addPage()).
  // Las páginas siguientes solo repiten el pie de página con numeración.
  doc.on('pageAdded', () => {
    numeroPagina += 1;
    doc.y = doc.page.margins.top;
    doc.x = margenIzq;
    dibujarPie();
  });

  dibujarEncabezado();
  dibujarPie();

  return doc;
}

function dibujarTabla(doc, { columnas, filas, anchoTotal }) {
  const inicioX = doc.page.margins.left;
  const ancho = anchoTotal || doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const pesos = columnas.map((c) => c.ancho || 1);
  const sumaPesos = pesos.reduce((a, b) => a + b, 0);
  const anchoColumna = pesos.map((p) => (p / sumaPesos) * ancho);
  const alturaFila = 24;
  const limiteInferior = () => doc.page.height - doc.page.margins.bottom - 24;

  function dibujarBadge(texto, badgeInfo, x, y, ancho2) {
    doc.font('Helvetica-Bold').fontSize(8);
    const anchoTexto = doc.widthOfString(badgeInfo.label);
    const anchoPill = Math.min(ancho2 - 4, anchoTexto + 14);
    const altoPill = 15;
    const xPill = x;
    const yPill = y - 1;
    if (badgeInfo.outline) {
      doc.roundedRect(xPill, yPill, anchoPill, altoPill, altoPill / 2).lineWidth(1).strokeColor(badgeInfo.fg).stroke();
    } else {
      doc.roundedRect(xPill, yPill, anchoPill, altoPill, altoPill / 2).fill(badgeInfo.bg);
    }
    doc.fillColor(badgeInfo.fg).text(badgeInfo.label, xPill, yPill + 3.5, { width: anchoPill, align: 'center' });
    doc.fillColor(COLOR.ink);
  }

  function fila(valores, { negrita = false, esEncabezado = false, indice = 0 } = {}) {
    if (doc.y + alturaFila > limiteInferior()) {
      doc.addPage();
    }
    const y = doc.y;
    if (!esEncabezado && indice % 2 === 1) {
      doc.rect(inicioX, y, ancho, alturaFila).fill(COLOR.creamZebra);
    }

    const colorTexto = COLOR.ink;
    doc.font(negrita || esEncabezado ? 'Helvetica-Bold' : 'Helvetica').fontSize(esEncabezado ? 8.5 : 9);
    let x = inicioX;
    valores.forEach((valor, i) => {
      const col = columnas[i];
      if (!esEncabezado && col.badge) {
        const badgeInfo = col.badge(valor);
        if (badgeInfo) {
          dibujarBadge(String(valor ?? ''), badgeInfo, x + 4, y + 5, anchoColumna[i] - 8);
          x += anchoColumna[i];
          return;
        }
      }
      doc.fillColor(colorTexto);
      doc.text(String(valor ?? ''), x + 4, y + 7, { width: anchoColumna[i] - 8, align: col.align || 'left' });
      x += anchoColumna[i];
    });
    doc.fillColor(COLOR.ink);
    doc.y = y + alturaFila;
    if (esEncabezado) {
      doc.moveTo(inicioX, doc.y).lineTo(inicioX + ancho, doc.y).lineWidth(1.2).strokeColor(COLOR.ink).stroke();
    } else {
      doc.moveTo(inicioX, doc.y).lineTo(inicioX + ancho, doc.y).lineWidth(0.4).strokeColor(COLOR.cream).stroke();
    }
  }

  fila(columnas.map((c) => c.titulo), { esEncabezado: true });
  if (filas.length === 0) {
    doc.font('Helvetica').fontSize(9).fillColor(COLOR.mutedLight).text('Sin datos para este periodo.', inicioX, doc.y + 10);
    doc.moveDown(1);
    doc.fillColor(COLOR.ink);
    doc.x = inicioX;
    return;
  }
  filas.forEach((valores, indice) => fila(valores, { indice }));
  doc.moveDown(0.8);
  doc.x = inicioX;
}

module.exports = { crearReportePDF, dibujarTabla, formatoMoneda, formatoFecha, COLOR };

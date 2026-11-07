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

// Colores de la marca para las hojas que se imprimen (agenda, historia
// clínica); en blanco y negro quedan en grises legibles.
const MARCA = {
  espresso: '#5F4534',
  tan: '#73593F',
  ink: '#2B221A',
  muted: '#7A6A5C',
  linea: '#DDD2C5',
  suave: '#F6F1EC',
  blanco: '#FFFFFF',
};

// 59171234567 -> +591 71234567 (los números de Bolivia se guardan con el código de país).
function telefonoLegible(t) {
  const s = String(t || '').replace(/\D/g, '');
  return /^591\d{8}$/.test(s) ? `+591 ${s.slice(3)}` : t;
}

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

// Reportes con el mismo estilo que la agenda y la historia clínica: membrete en
// la primera hoja, encabezado corto en las demás y pie con "Página X de N".
const MARGEN = { top: 66, bottom: 54, left: 46, right: 46 };

function ahoraLegible() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function crearReportePDF(res, config, { titulo, nombreArchivo, desde, hasta }) {
  const doc = new PDFDocument({ size: 'A4', margins: MARGEN, bufferPages: true });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
  doc.pipe(res);

  const izq = MARGEN.left;
  const der = doc.page.width - MARGEN.right;
  const ancho = der - izq;
  const periodo = desde && hasta ? (desde === hasta ? `Del ${formatoFecha(desde)}` : `Del ${formatoFecha(desde)} al ${formatoFecha(hasta)}`) : '';
  const generado = ahoraLegible();
  const raya = (x1, x2, y, color, grosor) => doc.moveTo(x1, y).lineTo(x2, y).lineWidth(grosor).strokeColor(color).stroke();

  // --- Membrete de la primera hoja ---
  const y = 36;
  let xTexto = izq;
  const logo = rutaLogoEmbebible(config.logo_url);
  if (logo) {
    try {
      const img = doc.openImage(logo);
      const anchoLogo = Math.min(110, 44 * (img.width / img.height));
      doc.image(logo, izq, y, { width: anchoLogo, height: 44 });
      xTexto = izq + anchoLogo + 12;
    } catch {
      // Logo ilegible: se sigue sin él.
    }
  }
  const anchoClinica = izq + 250 - xTexto;
  doc.font('Times-Roman').fontSize(18).fillColor(MARCA.espresso).text(config.nombre_consultorio || 'Clínica', xTexto, y + 3, { width: anchoClinica, height: 22, ellipsis: true, lineBreak: false });
  doc.font('Helvetica').fontSize(7).fillColor(MARCA.muted);
  const lugar = [config.direccion, config.ciudad].map((x) => (x || '').trim()).filter(Boolean).join(', ');
  if (lugar) doc.text(lugar, xTexto, y + 24, { width: anchoClinica, height: 18, ellipsis: true, lineGap: 0.5 });
  const contacto = [telefonoLegible(config.telefono), config.email, config.nit ? `NIT ${config.nit}` : null].filter(Boolean).join('  ·  ');
  if (contacto) doc.text(contacto, xTexto, lugar ? doc.y + 1 : y + 24, { width: anchoClinica, lineBreak: false });

  const xDerecha = izq + 262;
  doc.font('Helvetica').fontSize(7.5).fillColor(MARCA.tan).text('REPORTE', xDerecha, y + 2, { width: der - xDerecha, align: 'right', characterSpacing: 1.6 });
  doc.font('Times-Roman').fontSize(19).fillColor(MARCA.ink).text(titulo, xDerecha, y + 13, { width: der - xDerecha, align: 'right', height: 22, ellipsis: true });
  if (periodo) doc.font('Helvetica').fontSize(8).fillColor(MARCA.muted).text(periodo, xDerecha, y + 36, { width: der - xDerecha, align: 'right' });

  raya(izq, der, y + 56, MARCA.espresso, 1.2);
  doc.x = izq;
  doc.y = y + 70;
  doc.fillColor(MARCA.ink);

  // Encabezado corto (desde la hoja 2) y pie en todas, al cerrar el documento:
  // así se sabe el total de hojas.
  const terminar = doc.end.bind(doc);
  doc.end = () => {
    const rango = doc.bufferedPageRange();
    for (let i = 0; i < rango.count; i += 1) {
      doc.switchToPage(rango.start + i);
      const margenInferior = doc.page.margins.bottom;
      doc.page.margins.bottom = 0; // el pie va dentro del margen: sin esto pdfkit abre otra página
      if (i > 0) {
        doc.font('Times-Roman').fontSize(10).fillColor(MARCA.espresso).text(config.nombre_consultorio || 'Clínica', izq, 34, { width: ancho / 2, lineBreak: false });
        doc.font('Helvetica').fontSize(7).fillColor(MARCA.muted).text(`${titulo.toUpperCase()}${periodo ? `  ·  ${periodo}` : ''}`, izq + ancho / 2 - 60, 35, { width: ancho / 2 + 60, align: 'right', characterSpacing: 0.6, lineBreak: false });
        raya(izq, der, 50, MARCA.linea, 0.5);
      }
      const yPie = doc.page.height - 34;
      raya(izq, der, yPie - 8, MARCA.linea, 0.5);
      doc.font('Helvetica').fontSize(7).fillColor(MARCA.muted);
      doc.text(config.pie_pdf || config.nombre_consultorio || '', izq, yPie, { width: ancho / 2, lineBreak: false });
      doc.text(`Generado ${generado}   ·   Página ${i + 1} de ${rango.count}`, izq + ancho / 2, yPie, { width: ancho / 2, align: 'right', lineBreak: false });
      doc.page.margins.bottom = margenInferior;
    }
    terminar();
  };

  return doc;
}

const limiteInferior = (doc) => doc.page.height - doc.page.margins.bottom - 6;
function asegurar(doc, alto) {
  if (doc.y + alto > limiteInferior(doc)) doc.addPage();
  doc.x = doc.page.margins.left;
}

// Cifras principales en recuadros (hasta 4 por fila). `destacado` va en el color de la marca.
function dibujarResumen(doc, items) {
  const izq = doc.page.margins.left;
  const ancho = doc.page.width - izq - doc.page.margins.right;
  const porFila = Math.min(4, items.length);
  const sep = 8;
  const anchoCaja = (ancho - sep * (porFila - 1)) / porFila;
  const alto = 46;
  for (let i = 0; i < items.length; i += porFila) {
    asegurar(doc, alto + 10);
    const y = doc.y;
    items.slice(i, i + porFila).forEach(({ etiqueta, valor, detalle, destacado }, j) => {
      const x = izq + j * (anchoCaja + sep);
      doc.roundedRect(x, y, anchoCaja, alto, 6).fill(destacado ? MARCA.espresso : MARCA.suave);
      doc.font('Helvetica').fontSize(6.6).fillColor(destacado ? '#E8DDD2' : MARCA.muted)
        .text(String(etiqueta).toUpperCase(), x + 10, y + 8, { width: anchoCaja - 20, height: 9, characterSpacing: 0.8, ellipsis: true });
      doc.font('Helvetica-Bold').fontSize(13).fillColor(destacado ? MARCA.blanco : MARCA.ink)
        .text(String(valor), x + 10, y + 20, { width: anchoCaja - 20, height: 15, ellipsis: true });
      if (detalle) {
        doc.font('Helvetica').fontSize(7).fillColor(destacado ? '#E8DDD2' : MARCA.muted)
          .text(detalle, x + 10, y + 35, { width: anchoCaja - 20, height: 8, ellipsis: true });
      }
    });
    doc.y = y + alto + sep;
  }
  doc.y += 6;
  doc.x = izq;
  doc.fillColor(MARCA.ink);
}

// Título de cada parte del reporte; no queda solo al final de una hoja.
function dibujarSubtitulo(doc, texto, nota) {
  const izq = doc.page.margins.left;
  const der = doc.page.width - doc.page.margins.right;
  asegurar(doc, 80);
  doc.y += 6;
  const y = doc.y;
  doc.font('Times-Roman').fontSize(13.5).fillColor(MARCA.ink).text(texto, izq, y, { lineBreak: false });
  if (nota) doc.font('Helvetica').fontSize(7.5).fillColor(MARCA.muted).text(nota, izq, y + 4, { width: der - izq, align: 'right', lineBreak: false });
  doc.moveTo(izq, y + 19).lineTo(der, y + 19).lineWidth(0.8).strokeColor(MARCA.espresso).stroke();
  doc.y = y + 26;
  doc.x = izq;
}

// Tabla con encabezado suave (se repite en cada hoja) y filas separadas por líneas.
// `pie`: fila de totales en negrita al final.
function dibujarTabla(doc, { columnas, filas, anchoTotal, pie, vacio = 'Sin datos para este período.' }) {
  const inicioX = doc.page.margins.left;
  const ancho = anchoTotal || doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const pesos = columnas.map((c) => c.ancho || 1);
  const sumaPesos = pesos.reduce((a, b) => a + b, 0);
  const anchoColumna = pesos.map((p) => (p / sumaPesos) * ancho);
  const alturaFila = 21;

  function celdas(valores, y, { fuente, tam, color }) {
    let x = inicioX;
    doc.font(fuente).fontSize(tam).fillColor(color);
    valores.forEach((valor, i) => {
      // Una sola línea por celda: lo que no entra termina en "…".
      doc.text(String(valor ?? ''), x + 8, y, { width: anchoColumna[i] - 16, height: tam + 2, align: columnas[i].align || 'left', ellipsis: true });
      x += anchoColumna[i];
    });
  }

  function encabezado() {
    const y = doc.y;
    doc.roundedRect(inicioX, y, ancho, 20, 4).fill(MARCA.suave);
    let x = inicioX;
    doc.font('Helvetica-Bold').fontSize(6.8).fillColor(MARCA.muted);
    columnas.forEach((c, i) => {
      doc.text(c.titulo.toUpperCase(), x + 8, y + 7, { width: anchoColumna[i] - 16, height: 8, align: c.align || 'left', characterSpacing: 0.6, ellipsis: true });
      x += anchoColumna[i];
    });
    doc.y = y + 20;
  }

  asegurar(doc, 20 + alturaFila * Math.min(2, Math.max(filas.length, 1)));
  encabezado();

  if (filas.length === 0) {
    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MARCA.muted).text(vacio, inicioX + 8, doc.y + 8, { width: ancho - 16 });
    doc.y += 14;
    doc.moveTo(inicioX, doc.y).lineTo(inicioX + ancho, doc.y).lineWidth(0.5).strokeColor(MARCA.linea).stroke();
  }
  filas.forEach((valores) => {
    if (doc.y + alturaFila > limiteInferior(doc)) {
      doc.addPage();
      encabezado();
    }
    const y = doc.y;
    celdas(valores, y + 7, { fuente: 'Helvetica', tam: 8.8, color: MARCA.ink });
    doc.y = y + alturaFila;
    doc.moveTo(inicioX, doc.y).lineTo(inicioX + ancho, doc.y).lineWidth(0.5).strokeColor(MARCA.linea).stroke();
  });
  if (pie && filas.length) {
    if (doc.y + alturaFila > limiteInferior(doc)) doc.addPage();
    const y = doc.y;
    doc.moveTo(inicioX, y).lineTo(inicioX + ancho, y).lineWidth(1).strokeColor(MARCA.espresso).stroke();
    celdas(pie, y + 7, { fuente: 'Helvetica-Bold', tam: 9, color: MARCA.ink });
    doc.y = y + alturaFila;
  }
  doc.y += 16;
  doc.x = inicioX;
  doc.fillColor(MARCA.ink);
}

module.exports = { crearReportePDF, dibujarTabla, dibujarResumen, dibujarSubtitulo, formatoMoneda, formatoFecha, rutaLogoEmbebible, COLOR, MARCA, telefonoLegible };

const { crearReportePDF, COLOR } = require('./pdf');

// Dibuja los bloques de armarDocumento con pdfkit. Las casillas se dibujan
// como rectángulos: las fuentes estándar de PDF (Helvetica) no tienen ☐/☒.
const TAM = 9;
const CAJA = 8;

function enviarHistoriaPdf(res, documento, config, nombreArchivo) {
  const doc = crearReportePDF(res, config, { titulo: 'Historia clínica', nombreArchivo });
  const izq = doc.page.margins.left;
  const der = doc.page.width - doc.page.margins.right;
  const ancho = der - izq;
  const limite = () => doc.page.height - doc.page.margins.bottom - 20;
  const asegurar = (alto) => {
    if (doc.y + alto > limite()) doc.addPage();
  };

  doc.font('Helvetica').fontSize(TAM).fillColor(COLOR.ink);
  doc.text(`Fecha: ${documento.fecha || '____/____/______'}      N° de historia: ${documento.numero || '__________'}`, izq, doc.y);
  doc.moveDown(0.6);

  function casillas(items) {
    doc.font('Helvetica').fontSize(TAM);
    const altoMin = TAM + 6;
    const anchoMaxTexto = ancho - CAJA - 4;
    let x = izq;
    asegurar(altoMin);
    let y = doc.y;
    let altoFila = altoMin;
    const nuevaLinea = () => {
      y += altoFila;
      altoFila = altoMin;
      x = izq;
    };
    for (const item of items) {
      const detalles = item.detalles.map((d) => ` ${d.etiqueta}: ${d.valor || '__________'}`).join('');
      const texto = `${item.etiqueta}${detalles}`;
      // Nunca se recorta: si no entra en lo que queda de la línea pasa a la
      // siguiente, y si es más ancho que la hoja se parte en varias líneas.
      const natural = doc.widthOfString(texto);
      const anchoTexto = Math.min(natural, anchoMaxTexto);
      const alto = natural > anchoMaxTexto
        ? Math.max(altoMin, doc.heightOfString(texto, { width: anchoMaxTexto }) + 4)
        : altoMin;
      const anchoItem = CAJA + 4 + anchoTexto + 14;
      if (x + anchoItem > der && x > izq) nuevaLinea();
      if (y + alto > limite()) {
        doc.addPage();
        y = doc.y;
        x = izq;
        altoFila = altoMin;
      }
      doc.lineWidth(0.7).strokeColor(COLOR.ink).rect(x, y + 1, CAJA, CAJA).stroke();
      if (item.marcado) {
        doc.moveTo(x + 1.5, y + 2.5).lineTo(x + CAJA - 1.5, y + CAJA - 0.5).moveTo(x + CAJA - 1.5, y + 2.5).lineTo(x + 1.5, y + CAJA - 0.5).stroke();
      }
      doc.fillColor(COLOR.ink).text(texto, x + CAJA + 4, y, { width: natural > anchoMaxTexto ? anchoMaxTexto : anchoTexto + 2 });
      x += anchoItem;
      altoFila = Math.max(altoFila, alto);
    }
    doc.y = y + altoFila;
    doc.x = izq;
  }

  function tabla(columnas, filas) {
    const anchoCol = ancho / columnas.length;
    const fila = (valores, encabezado) => {
      doc.font(encabezado ? 'Helvetica-Bold' : 'Helvetica').fontSize(TAM);
      const alto = Math.max(18, ...valores.map((v) => doc.heightOfString(String(v || ' '), { width: anchoCol - 8 }) + 8));
      asegurar(alto);
      const y = doc.y;
      valores.forEach((v, i) => {
        doc.lineWidth(0.6).strokeColor(COLOR.manhattan).rect(izq + i * anchoCol, y, anchoCol, alto).stroke();
        doc.fillColor(COLOR.ink).text(String(v || ''), izq + i * anchoCol + 4, y + 4, { width: anchoCol - 8 });
      });
      doc.y = y + alto;
    };
    fila(columnas, true);
    filas.forEach((f) => fila(f, false));
    doc.moveDown(0.6);
    doc.x = izq;
  }

  for (const b of documento.bloques) {
    if (b.tipo === 'seccion') {
      // El compromiso legal y las firmas van juntos en la misma hoja.
      asegurar(b.titulo.includes('Compromiso') ? 230 : 40);
      doc.moveDown(0.6);
      doc.font('Helvetica-Bold').fontSize(12).fillColor(COLOR.ink).text(b.titulo, izq, doc.y);
      doc.moveDown(0.2);
    } else if (b.tipo === 'grupo') {
      asegurar(30);
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLOR.espresso).text(b.titulo, izq, doc.y);
      if (b.subtitulo) doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(COLOR.muted).text(b.subtitulo, izq, doc.y);
    } else if (b.tipo === 'casillas') {
      casillas(b.items);
    } else if (b.tipo === 'etiqueta') {
      asegurar(TAM + 6);
      doc.font('Helvetica-Bold').fontSize(TAM).fillColor(COLOR.ink).text(`${b.texto}:`, izq, doc.y);
    } else if (b.tipo === 'campo') {
      asegurar(TAM + 6);
      doc.font('Helvetica-Bold').fontSize(TAM).fillColor(COLOR.ink).text(`${b.etiqueta}: `, izq, doc.y, { continued: true });
      doc.font('Helvetica').text(b.valor || '______________________________', { width: ancho });
    } else if (b.tipo === 'parrafo') {
      asegurar(TAM * 3);
      doc.font('Helvetica-Bold').fontSize(TAM).fillColor(COLOR.ink).text(`${b.etiqueta}:`, izq, doc.y);
      if (b.valor) {
        doc.font('Helvetica').text(b.valor, izq, doc.y, { width: ancho });
        doc.moveDown(0.4);
      } else {
        for (let i = 0; i < 2; i += 1) {
          doc.moveDown(0.9);
          doc.moveTo(izq, doc.y).lineTo(der, doc.y).lineWidth(0.5).strokeColor(COLOR.mutedLight).stroke();
        }
        doc.moveDown(0.4);
      }
    } else if (b.tipo === 'tabla') {
      tabla(b.columnas, b.filas);
    } else if (b.tipo === 'compromiso') {
      doc.font('Helvetica').fontSize(TAM).fillColor(COLOR.ink).text(b.texto, izq, doc.y, { width: ancho, align: 'justify' });
    } else if (b.tipo === 'firmas') {
      asegurar(90);
      doc.moveDown(4);
      const y = doc.y;
      const mitad = ancho / 2;
      for (const [i, titulo] of ['Firma del paciente', 'Firma del especialista'].entries()) {
        const x = izq + i * mitad;
        doc.moveTo(x, y).lineTo(x + mitad - 40, y).lineWidth(0.7).strokeColor(COLOR.ink).stroke();
        doc.font('Helvetica').fontSize(TAM).text(titulo, x, y + 4, { width: mitad - 40 });
        doc.text('C.I.', x, doc.y, { width: mitad - 40 });
      }
    }
  }

  doc.end();
}

module.exports = { enviarHistoriaPdf };

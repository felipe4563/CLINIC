const fs = require('fs');
const { crearReportePDF, COLOR } = require('./pdf');

// Dibuja los bloques de armarDocumento con pdfkit. Las casillas se dibujan
// como rectángulos: las fuentes estándar de PDF (Helvetica) no tienen ☐/☒.
const TAM = 9;
const CAJA = 8;
const ALTO_FIRMAS = 140;

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
  doc.text(`Fecha: ${documento.fecha || '____/____/______'}      Emitido: ${documento.emitido}      N° de historia: ${documento.numero || '__________'}`, izq, doc.y);
  doc.moveDown(0.6);

  // Imagen ajustada al ancho dado sin pasar el alto máximo; si falta o no se
  // puede leer, se omite (el documento se genera igual).
  function imagen(ruta, x, anchoMax, altoMax) {
    if (!ruta || !fs.existsSync(ruta)) return 0;
    try {
      const img = doc.openImage(ruta);
      const escala = Math.min(anchoMax / img.width, altoMax / img.height, 1);
      const w = img.width * escala;
      const hImg = img.height * escala;
      doc.image(img, x, doc.y, { width: w, height: hImg });
      return hImg;
    } catch {
      return 0;
    }
  }

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

  // Alto que necesita el bloque siguiente a un título, para no dejarlo solo al pie.
  const altoSiguiente = (b) => {
    if (!b) return 0;
    if (b.tipo === 'imagen') return 174;
    if (b.tipo === 'fotos') return b.fotos.length ? 224 : 90;
    if (b.tipo === 'parrafo' && !b.valor) return TAM * (b.lineas || 2) + TAM;
    if (b.tipo === 'texto' || b.tipo === 'campo') return 2 * TAM + 6;
    return 0;
  };

  for (const [idx, b] of documento.bloques.entries()) {
    if (b.tipo === 'seccion') {
      // El consentimiento va en hojas propias: se imprime y firma aparte.
      if (b.titulo.includes('Consentimiento')) doc.addPage();
      else asegurar(40);
      doc.moveDown(0.6);
      doc.font('Helvetica-Bold').fontSize(12).fillColor(COLOR.ink).text(b.titulo, izq, doc.y);
      doc.moveDown(0.2);
    } else if (b.tipo === 'grupo') {
      if (b.juntoAFirmas) {
        doc.font('Helvetica').fontSize(TAM);
        const textos = documento.bloques.slice(idx + 1).filter((x) => x.tipo === 'texto' && x.juntoAFirmas);
        asegurar(30 + textos.reduce((t, x) => t + doc.heightOfString(x.texto, { width: ancho }) + 4, 0) + ALTO_FIRMAS);
      }
      asegurar(30 + altoSiguiente(documento.bloques[idx + 1]));
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
      asegurar(TAM * (b.lineas || 2) + TAM);
      doc.font('Helvetica-Bold').fontSize(TAM).fillColor(COLOR.ink).text(`${b.etiqueta}:`, izq, doc.y);
      if (b.valor) {
        doc.font('Helvetica').text(b.valor, izq, doc.y, { width: ancho });
        doc.moveDown(0.4);
      } else {
        for (let i = 0; i < (b.lineas || 2); i += 1) {
          doc.moveDown(0.9);
          doc.moveTo(izq, doc.y).lineTo(der, doc.y).lineWidth(0.5).strokeColor(COLOR.mutedLight).stroke();
        }
        doc.moveDown(0.4);
      }
    } else if (b.tipo === 'tabla') {
      tabla(b.columnas, b.filas);
    } else if (b.tipo === 'imagen') {
      asegurar(170);
      const alto = imagen(b.archivo, izq, ancho, 170);
      doc.y += alto + 4;
      doc.x = izq;
    } else if (b.tipo === 'fotos') {
      if (!b.fotos.length) {
        asegurar(90);
        const y = doc.y + 2;
        doc.lineWidth(0.6).strokeColor(COLOR.manhattan).rect(izq, y, ancho, 80).stroke();
        doc.y = y + 86;
      } else {
        const col = (ancho - 12) / 2;
        const altoFoto = 200;
        for (let i = 0; i < b.fotos.length; i += 2) {
          const fila = b.fotos.slice(i, i + 2);
          doc.font('Helvetica').fontSize(8);
          const altoNota = (f) => (f.nota ? doc.heightOfString(f.nota, { width: col }) + 4 : 0);
          asegurar(altoFoto + Math.max(...fila.map(altoNota)) + 10);
          const y = doc.y;
          let altoFila = 0;
          for (const [j, f] of fila.entries()) {
            const x = izq + j * (col + 12);
            doc.y = y;
            const alto = imagen(f.ruta, x, col, altoFoto);
            if (f.nota) doc.font('Helvetica').fontSize(8).fillColor(COLOR.muted).text(f.nota, x, y + alto + 2, { width: col });
            doc.font('Helvetica').fontSize(8);
            altoFila = Math.max(altoFila, alto + altoNota(f));
          }
          doc.y = y + altoFila + 8;
        }
      }
      doc.x = izq;
    } else if (b.tipo === 'consentimiento') {
      asegurar(60);
      doc.moveDown(0.4);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(COLOR.espresso).text(b.titulo.toUpperCase(), izq, doc.y, { width: ancho, align: 'center' });
      doc.moveDown(0.2);
    } else if (b.tipo === 'texto') {
      doc.font('Helvetica').fontSize(TAM);
      asegurar(Math.min(doc.heightOfString(b.texto, { width: ancho }), 60) + 4);
      doc.fillColor(COLOR.ink).text(b.texto, izq, doc.y, { width: ancho, align: 'justify' });
      doc.moveDown(0.2);
    } else if (b.tipo === 'firmas') {
      // Una columna por firmante (línea, título y datos debajo); fecha y hora a mano.
      asegurar(ALTO_FIRMAS);
      doc.moveDown(4);
      const y = doc.y;
      const col = ancho / b.firmantes.length;
      let abajo = y;
      for (const [i, f] of b.firmantes.entries()) {
        const x = izq + i * col;
        const w = col - 24;
        doc.moveTo(x, y).lineTo(x + w, y).lineWidth(0.7).strokeColor(COLOR.ink).stroke();
        doc.font('Helvetica-Bold').fontSize(TAM).fillColor(COLOR.ink).text(f.titulo, x, y + 4, { width: w });
        doc.font('Helvetica');
        for (const linea of f.lineas) doc.text(linea, x, doc.y, { width: w });
        abajo = Math.max(abajo, doc.y);
      }
      doc.y = abajo + 18;
      doc.font('Helvetica').fontSize(TAM).text('Fecha: ____/____/______      Hora: ________', izq, doc.y);
      doc.moveDown(0.6);
    }
  }

  doc.end();
}

module.exports = { enviarHistoriaPdf };

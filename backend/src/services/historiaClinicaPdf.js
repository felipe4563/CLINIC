const fs = require('fs');
const PDFDocument = require('pdfkit');
const { rutaLogoEmbebible, MARCA: C } = require('./pdf');

// Dibuja los bloques de armarDocumento con pdfkit, con el mismo estilo que la
// hoja de agenda: encabezado con la paciente, datos en dos columnas con línea
// para escribir, casillas alineadas en columnas. Las casillas se dibujan como
// rectángulos: las fuentes estándar de PDF (Helvetica) no tienen ☐/☒.
const TAM = 9;
const CAJA = 8;
const ALTO_FIRMAS = 140;
const SEPARACION = 18;
const ARRIBA = 66; // margen superior de las hojas 2 en adelante (encabezado corto)

function enviarHistoriaPdf(res, documento, config, nombreArchivo) {
  const doc = new PDFDocument({ size: 'A4', margins: { top: ARRIBA, bottom: 54, left: 46, right: 46 }, bufferPages: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
  doc.pipe(res);

  const izq = doc.page.margins.left;
  const der = doc.page.width - doc.page.margins.right;
  const ancho = der - izq;
  const limite = () => doc.page.height - doc.page.margins.bottom - 6;
  const asegurar = (alto) => {
    if (doc.y + alto > limite()) doc.addPage();
    doc.x = izq;
  };
  const rotulo = (texto, x, y, opciones = {}) => {
    doc.font('Helvetica').fontSize(6.6).fillColor(C.muted).text(texto.toUpperCase(), x, y, { characterSpacing: 0.8, lineBreak: false, ...opciones });
  };
  const raya = (x1, x2, y, color = C.linea, grosor = 0.5) => {
    doc.moveTo(x1, y).lineTo(x2, y).lineWidth(grosor).strokeColor(color).stroke();
  };

  // --- Encabezado de la primera hoja ---
  let y = 36;
  const logo = rutaLogoEmbebible(config.logo_url);
  let xTexto = izq;
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
  doc.font('Times-Roman').fontSize(18).fillColor(C.espresso).text(config.nombre_consultorio || 'Clínica', xTexto, y + 3, { width: anchoClinica, height: 22, ellipsis: true, lineBreak: false });
  // Dirección hasta en dos líneas y debajo teléfono y correo.
  doc.font('Helvetica').fontSize(7).fillColor(C.muted);
  if (config.direccion) doc.text(config.direccion, xTexto, y + 24, { width: anchoClinica, height: 18, ellipsis: true, lineGap: 0.5 });
  const contacto = [config.telefono, config.email].filter(Boolean).join('  ·  ');
  if (contacto) doc.text(contacto, xTexto, config.direccion ? doc.y + 1 : y + 24, { width: anchoClinica, lineBreak: false });

  const xDerecha = izq + 262;
  doc.font('Helvetica').fontSize(7.5).fillColor(C.tan).text(documento.soloConsentimiento ? 'CONSENTIMIENTO INFORMADO' : 'HISTORIA CLÍNICA', xDerecha, y + 2, { width: der - xDerecha, align: 'right', characterSpacing: 1.6 });
  if (documento.paciente) {
    doc.font('Times-Roman').fontSize(19).fillColor(C.ink).text(documento.paciente, xDerecha, y + 13, { width: der - xDerecha, align: 'right', height: 22, ellipsis: true });
    const sub = [documento.numero, documento.fecha ? `Evaluación del ${documento.fecha}` : null].filter(Boolean).join('   ·   ');
    doc.font('Helvetica').fontSize(8).fillColor(C.muted).text(sub, xDerecha, y + 36, { width: der - xDerecha, align: 'right' });
  } else {
    doc.font('Times-Roman').fontSize(19).fillColor(C.ink).text('Formulario de evaluación', xDerecha, y + 13, { width: der - xDerecha, align: 'right' });
    doc.font('Helvetica').fontSize(8).fillColor(C.muted).text('Para llenar a mano', xDerecha, y + 36, { width: der - xDerecha, align: 'right' });
  }

  y += 56;
  raya(izq, der, y, C.espresso, 1.2);
  y += 12;

  // Resumen: en el formulario en blanco quedan vacíos para escribir.
  const resumen = [
    ['N° de historia', documento.numero],
    ['Fecha de evaluación', documento.fecha],
    ['Especialista', documento.especialista],
    ['Emitido', documento.enBlanco ? '' : documento.emitido],
  ];
  const anchoCaja = (ancho - 3 * 8) / 4;
  resumen.forEach(([etiqueta, valor], i) => {
    const x = izq + i * (anchoCaja + 8);
    doc.roundedRect(x, y, anchoCaja, 36, 6).fill(C.suave);
    rotulo(etiqueta, x + 10, y + 7, { width: anchoCaja - 20 });
    if (valor) doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.ink).text(valor, x + 10, y + 19, { width: anchoCaja - 20, height: 12, ellipsis: true, lineBreak: false });
    else raya(x + 10, x + anchoCaja - 10, y + 29, C.linea, 0.6);
  });
  doc.y = y + 36 + 4;
  doc.x = izq;

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

  function caja(x, yCaja, marcado) {
    doc.roundedRect(x, yCaja, CAJA, CAJA, 1.5);
    if (marcado) {
      doc.fill(C.espresso);
      doc.moveTo(x + 1.8, yCaja + 4.3).lineTo(x + 3.4, yCaja + 6).lineTo(x + 6.4, yCaja + 2.2).lineWidth(1.1).strokeColor(C.blanco).stroke();
    } else {
      doc.lineWidth(0.7).strokeColor(C.tan).stroke();
    }
  }

  const textoDe = (item) => `${item.etiqueta}${item.detalles.map((d) => `   ${d.etiqueta}: ${d.valor || '________'}`).join('')}`;

  // Casillas en columnas parejas (hasta 4) según el texto más largo.
  function casillas(items) {
    doc.font('Helvetica').fontSize(TAM);
    const textos = items.map(textoDe);
    const masAncho = Math.max(...textos.map((t) => doc.widthOfString(t))) + CAJA + 20;
    const columnas = Math.max(1, Math.min(4, Math.floor(ancho / masAncho)));
    const anchoCol = ancho / columnas;
    doc.y += 2;
    for (let i = 0; i < items.length; i += columnas) {
      const fila = items.slice(i, i + columnas);
      const alto = Math.max(...fila.map((_, j) => doc.heightOfString(textos[i + j], { width: anchoCol - CAJA - 12 }))) + 5;
      asegurar(alto);
      const yFila = doc.y;
      fila.forEach((item, j) => {
        const x = izq + j * anchoCol;
        caja(x, yFila + 0.5, item.marcado);
        doc.font(item.marcado ? 'Helvetica-Bold' : 'Helvetica').fontSize(TAM).fillColor(C.ink).text(textos[i + j], x + CAJA + 5, yFila, { width: anchoCol - CAJA - 12 });
      });
      doc.y = yFila + alto;
    }
    doc.y += 3;
    doc.x = izq;
  }

  // Casillas cortas en una línea (Sexo, Estado civil) dentro de una celda.
  function casillasEnLinea(items, x, yLinea) {
    let xi = x;
    for (const item of items) {
      caja(xi, yLinea + 0.5, item.marcado);
      doc.font(item.marcado ? 'Helvetica-Bold' : 'Helvetica').fontSize(TAM).fillColor(C.ink).text(item.etiqueta, xi + CAJA + 4, yLinea, { lineBreak: false });
      xi += CAJA + 4 + doc.widthOfString(item.etiqueta) + 16;
    }
  }

  // Campos en dos columnas: rótulo chico arriba y el dato sobre una línea.
  // Un dato largo, o un campo suelto, ocupa todo el ancho.
  function grilla(celdas) {
    const anchoCol = (ancho - SEPARACION) / 2;
    doc.font('Helvetica').fontSize(9.5);
    const anchoDe = (c) => (c.items || celdas.length === 1 || doc.widthOfString(c.valor || '') <= anchoCol - 4 ? anchoCol : ancho);
    const filas = [];
    for (const c of celdas) {
      const enteraSola = celdas.length === 1 && !c.items;
      const w = enteraSola ? ancho : anchoDe(c);
      const ultima = filas[filas.length - 1];
      if (w === anchoCol && ultima && ultima.length === 1 && ultima[0].w === anchoCol) ultima.push({ c, w });
      else filas.push([{ c, w }]);
    }
    for (const fila of filas) {
      const altoValor = (f) => (f.c.items || !f.c.valor ? 12 : doc.font('Helvetica').fontSize(9.5).heightOfString(f.c.valor, { width: f.w }));
      const alto = 10 + Math.max(...fila.map(altoValor)) + 12;
      asegurar(alto);
      const yFila = doc.y;
      fila.forEach((f, j) => {
        const x = izq + j * (anchoCol + SEPARACION);
        rotulo(f.c.etiqueta, x, yFila, { width: f.w });
        if (f.c.items) {
          casillasEnLinea(f.c.items, x, yFila + 11);
        } else {
          if (f.c.valor) doc.font('Helvetica').fontSize(9.5).fillColor(C.ink).text(f.c.valor, x, yFila + 10, { width: f.w });
          raya(x, x + f.w, yFila + 10 + altoValor(f) + 2);
        }
      });
      doc.y = yFila + alto;
    }
    doc.x = izq;
  }

  function tabla(columnas, filas) {
    const pesos = columnas.length === 3 ? [1, 2, 2.6] : columnas.map(() => 1);
    const total = pesos.reduce((a, b) => a + b, 0);
    const anchos = pesos.map((p) => (p / total) * ancho);
    const xs = anchos.map((_, i) => izq + anchos.slice(0, i).reduce((a, b) => a + b, 0));
    asegurar(22 + 24);
    const yEnc = doc.y + 2;
    doc.roundedRect(izq, yEnc, ancho, 18, 4).fill(C.suave);
    columnas.forEach((col, i) => rotulo(col, xs[i] + 8, yEnc + 6, { width: anchos[i] - 16 }));
    doc.y = yEnc + 18;
    if (!filas.length) {
      doc.font('Helvetica').fontSize(8.5).fillColor(C.muted).text('Sin tratamientos registrados.', izq + 8, doc.y + 8);
      doc.y += 8;
    }
    for (const valores of filas) {
      doc.font('Helvetica').fontSize(TAM);
      const alto = Math.max(24, ...valores.map((v, i) => doc.heightOfString(String(v || ' '), { width: anchos[i] - 16 }) + 12));
      asegurar(alto);
      const yFila = doc.y;
      valores.forEach((v, i) => doc.fillColor(C.ink).text(String(v || ''), xs[i] + 8, yFila + 6, { width: anchos[i] - 16 }));
      doc.y = yFila + alto;
      raya(izq, der, doc.y);
    }
    doc.y += 8;
    doc.x = izq;
  }

  // Alto que necesita el bloque siguiente a un título, para no dejarlo solo al pie.
  const altoSiguiente = (b) => {
    if (!b) return 0;
    if (b.tipo === 'imagen') return 174;
    if (b.tipo === 'fotos') return b.fotos.length ? 224 : 90;
    if (b.tipo === 'parrafo' && !b.valor) return 18 * (b.lineas || 2) + 14;
    if (['texto', 'campo', 'casillas', 'etiqueta', 'tabla'].includes(b.tipo)) return 36;
    return 0;
  };

  // "Sexo" + [F][M]: casillas cortas que van como una celda más de la grilla.
  const esOpcionCorta = (b, sig) => b.tipo === 'etiqueta' && sig && sig.tipo === 'casillas' && sig.items.length <= 5 && sig.items.every((it) => !it.detalles.length);

  const bloques = documento.bloques;
  let idx = 0;
  while (idx < bloques.length) {
    const b = bloques[idx];

    if (b.tipo === 'campo' || esOpcionCorta(b, bloques[idx + 1])) {
      const celdas = [];
      while (idx < bloques.length) {
        const x = bloques[idx];
        if (x.tipo === 'campo') {
          celdas.push({ etiqueta: x.etiqueta, valor: x.valor });
          idx += 1;
        } else if (esOpcionCorta(x, bloques[idx + 1])) {
          celdas.push({ etiqueta: x.texto, items: bloques[idx + 1].items });
          idx += 2;
        } else break;
      }
      grilla(celdas);
      continue;
    }

    if (b.tipo === 'seccion') {
      // El consentimiento va en hojas propias: se imprime y firma aparte.
      if (b.titulo.includes('Consentimiento')) doc.addPage();
      else asegurar(50 + altoSiguiente(bloques[idx + 1]));
      const [, numero, titulo] = b.titulo.match(/^(\d+)\.\s*(.*)$/) || [null, null, b.titulo];
      doc.y += 14;
      const yTit = doc.y;
      let xTit = izq;
      if (numero) {
        doc.font('Times-Roman').fontSize(20).fillColor(C.tan).text(numero.padStart(2, '0'), izq, yTit - 3, { lineBreak: false });
        xTit = izq + 30;
      }
      doc.font('Times-Roman').fontSize(15).fillColor(C.ink).text(titulo, xTit, yTit, { width: der - xTit });
      raya(izq, der, yTit + 22, C.espresso, 0.8);
      doc.y = yTit + 30;
    } else if (b.tipo === 'apartado') {
      // Con el título del grupo que sigue y lo que viene debajo.
      asegurar(30 + 30 + altoSiguiente(bloques[idx + 2]));
      doc.y += 6;
      const yAp = doc.y;
      doc.roundedRect(izq, yAp, ancho, 18, 4).fill(C.suave);
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.espresso).text(b.titulo.toUpperCase(), izq + 10, yAp + 5.5, { characterSpacing: 1.2, lineBreak: false });
      doc.y = yAp + 24;
    } else if (b.tipo === 'grupo') {
      if (b.juntoAFirmas) {
        doc.font('Helvetica').fontSize(TAM);
        const textos = bloques.slice(idx + 1).filter((x) => x.tipo === 'texto' && x.juntoAFirmas);
        asegurar(30 + textos.reduce((t, x) => t + doc.heightOfString(x.texto, { width: ancho }) + 4, 0) + ALTO_FIRMAS);
      }
      asegurar(24 + altoSiguiente(bloques[idx + 1]));
      doc.y += 6;
      const yGr = doc.y;
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.espresso).text(b.titulo, izq, yGr, { continued: !!b.subtitulo });
      if (b.subtitulo) doc.font('Helvetica-Oblique').fontSize(8).fillColor(C.muted).text(`   ${b.subtitulo}`);
      doc.y += 3;
      doc.x = izq;
    } else if (b.tipo === 'casillas') {
      casillas(b.items);
    } else if (b.tipo === 'etiqueta') {
      asegurar(24);
      rotulo(b.texto, izq, doc.y + 2);
      doc.y += 12;
    } else if (b.tipo === 'parrafo') {
      const lineas = b.lineas || 2;
      if (b.valor) {
        doc.font('Helvetica').fontSize(TAM);
        const alto = doc.heightOfString(b.valor, { width: ancho - 20 }) + 14;
        asegurar(Math.min(alto, 120) + 12);
        rotulo(b.etiqueta, izq, doc.y + 2);
        const yTx = doc.y + 12;
        if (yTx + alto <= limite()) {
          doc.rect(izq, yTx, 2, alto).fill(C.tan);
          doc.font('Helvetica').fontSize(TAM).fillColor(C.ink).text(b.valor, izq + 12, yTx + 7, { width: ancho - 20 });
          doc.y = yTx + alto + 6;
        } else {
          doc.font('Helvetica').fontSize(TAM).fillColor(C.ink).text(b.valor, izq, yTx, { width: ancho });
          doc.y += 6;
        }
      } else {
        asegurar(18 * lineas + 14);
        rotulo(b.etiqueta, izq, doc.y + 2);
        const yLn = doc.y + 4;
        for (let i = 1; i <= lineas; i += 1) raya(izq, der, yLn + i * 18);
        doc.y = yLn + lineas * 18 + 8;
      }
      doc.x = izq;
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
        const yF = doc.y + 2;
        doc.roundedRect(izq, yF, ancho, 80, 6).lineWidth(0.8).dash(3, { space: 3 }).strokeColor(C.linea).stroke().undash();
        doc.font('Helvetica').fontSize(7.5).fillColor(C.muted).text('Espacio para fotografías', izq, yF + 36, { width: ancho, align: 'center' });
        doc.y = yF + 88;
      } else {
        const col = (ancho - 12) / 2;
        const altoFoto = 200;
        for (let i = 0; i < b.fotos.length; i += 2) {
          const fila = b.fotos.slice(i, i + 2);
          doc.font('Helvetica').fontSize(8);
          const altoNota = (f) => (f.nota ? doc.heightOfString(f.nota, { width: col }) + 4 : 0);
          asegurar(altoFoto + Math.max(...fila.map(altoNota)) + 10);
          const yF = doc.y;
          let altoFila = 0;
          for (const [j, f] of fila.entries()) {
            const x = izq + j * (col + 12);
            doc.y = yF;
            const alto = imagen(f.ruta, x, col, altoFoto);
            if (f.nota) doc.font('Helvetica').fontSize(8).fillColor(C.muted).text(f.nota, x, yF + alto + 2, { width: col });
            doc.font('Helvetica').fontSize(8);
            altoFila = Math.max(altoFila, alto + altoNota(f));
          }
          doc.y = yF + altoFila + 8;
        }
      }
      doc.x = izq;
    } else if (b.tipo === 'consentimiento') {
      asegurar(60);
      doc.y += 4;
      doc.font('Times-Roman').fontSize(14).fillColor(C.espresso).text(b.titulo, izq, doc.y, { width: ancho, align: 'center' });
      const yR = doc.y + 4;
      raya(izq + ancho / 2 - 30, izq + ancho / 2 + 30, yR, C.tan, 0.8);
      doc.y = yR + 8;
    } else if (b.tipo === 'texto') {
      doc.font('Helvetica').fontSize(TAM);
      asegurar(Math.min(doc.heightOfString(b.texto, { width: ancho }), 60) + 4);
      doc.fillColor(C.ink).text(b.texto, izq, doc.y, { width: ancho, align: 'justify', lineGap: 1.2 });
      doc.y += 4;
    } else if (b.tipo === 'firmas') {
      // Fecha y hora a mano arriba a la derecha; luego una columna por firmante (línea, título y datos debajo).
      asegurar(ALTO_FIRMAS);
      doc.y += 18;
      doc.font('Helvetica').fontSize(TAM).fillColor(C.ink).text('Fecha: ____/____/______      Hora: ________', izq, doc.y, { width: ancho, align: 'right' });
      doc.y += 44;
      const yF = doc.y;
      const col = ancho / b.firmantes.length;
      let abajo = yF;
      for (const [i, f] of b.firmantes.entries()) {
        // Línea centrada en su columna y el texto centrado debajo.
        const x = izq + i * col + 20;
        const w = col - 40;
        raya(x, x + w, yF, C.ink, 0.7);
        doc.font('Helvetica-Bold').fontSize(TAM).fillColor(C.ink).text(f.titulo, x, yF + 5, { width: w, align: 'center' });
        doc.font('Helvetica').fontSize(8).fillColor(C.muted);
        for (const linea of f.lineas) doc.text(linea, x, doc.y, { width: w, align: 'center' });
        abajo = Math.max(abajo, doc.y);
      }
      doc.y = abajo + 8;
    }
    idx += 1;
  }

  // --- En cada hoja: encabezado corto (desde la 2) y pie con página X de N ---
  const rango = doc.bufferedPageRange();
  const quien = [documento.paciente, documento.numero].filter(Boolean).join('  ·  ');
  for (let i = 0; i < rango.count; i += 1) {
    doc.switchToPage(rango.start + i);
    const margenInferior = doc.page.margins.bottom;
    doc.page.margins.bottom = 0; // el pie va dentro del margen: sin esto pdfkit abre otra página
    if (i > 0) {
      doc.font('Times-Roman').fontSize(11).fillColor(C.espresso).text(config.nombre_consultorio || 'Clínica', izq, 32, { width: ancho / 2, lineBreak: false });
      doc.font('Helvetica').fontSize(7).fillColor(C.muted).text(`${documento.soloConsentimiento ? 'CONSENTIMIENTO INFORMADO' : 'HISTORIA CLÍNICA'}${quien ? `  ·  ${quien}` : ''}`, izq + ancho / 2 - 60, 35, { width: ancho / 2 + 60, align: 'right', characterSpacing: 0.6, lineBreak: false });
      raya(izq, der, 50);
    }
    const yPie = doc.page.height - 34;
    raya(izq, der, yPie - 8);
    doc.font('Helvetica').fontSize(7).fillColor(C.muted);
    doc.text(config.pie_pdf || config.nombre_consultorio || '', izq, yPie, { width: ancho / 2, lineBreak: false });
    doc.text(`Emitido ${documento.emitido}   ·   Página ${i + 1} de ${rango.count}`, izq + ancho / 2, yPie, { width: ancho / 2, align: 'right', lineBreak: false });
    doc.page.margins.bottom = margenInferior;
  }

  doc.end();
}

module.exports = { enviarHistoriaPdf };

const fs = require('fs');
const PDFDocument = require('pdfkit');
const {
  AlignmentType, BorderStyle, Document, Header, ImageRun, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType,
} = require('docx');
const { rutaLogoEmbebible } = require('./pdf');

// Mismo contenido que el PDF (bloques de armarDocumento), en Word editable.
const TAM = 18; // medios puntos: 9 pt
const MARCADA = '☒';
const VACIA = '☐';

function dimensionesImagen(ruta) {
  // pdfkit ya sabe leer PNG/JPEG: se usa solo para saber ancho y alto.
  const img = new PDFDocument({ autoFirstPage: false }).openImage(ruta);
  return { ancho: img.width, alto: img.height };
}

function encabezado(config) {
  const hijos = [];
  const ruta = rutaLogoEmbebible(config.logo_url);
  if (ruta) {
    try {
      const { ancho, alto } = dimensionesImagen(ruta);
      const altoObjetivo = 48;
      hijos.push(new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new ImageRun({
          type: /\.png$/i.test(ruta) ? 'png' : 'jpg',
          data: fs.readFileSync(ruta),
          transformation: { width: Math.round(altoObjetivo * (ancho / alto)), height: altoObjetivo },
        })],
      }));
    } catch {
      // Logo ilegible: el encabezado sigue sin imagen.
    }
  }
  hijos.push(new Paragraph({ children: [new TextRun({ text: config.nombre_consultorio || 'Clínica', bold: true, size: 28 })] }));
  const datos = [config.direccion, [config.ciudad, config.pais].filter(Boolean).join(', '), [config.telefono, config.email].filter(Boolean).join(' · ')]
    .filter(Boolean)
    .join('   ');
  if (datos) hijos.push(new Paragraph({ children: [new TextRun({ text: datos, size: 16, color: '5A5A5A' })] }));
  return new Header({ children: hijos });
}

function tabla(columnas, filas) {
  const borde = { style: BorderStyle.SINGLE, size: 4, color: 'B0B0B0' };
  const celda = (texto, negrita) => new TableCell({
    borders: { top: borde, bottom: borde, left: borde, right: borde },
    children: [new Paragraph({ children: [new TextRun({ text: texto || ' ', bold: negrita, size: TAM })] })],
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: columnas.map((c) => celda(c, true)) }),
      ...filas.map((f) => new TableRow({ children: f.map((v) => celda(String(v || ''), false)) })),
    ],
  });
}

async function generarHistoriaWord(documento, config) {
  const cuerpo = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'HISTORIA CLÍNICA', bold: true, size: 32 })] }),
    new Paragraph({ children: [new TextRun({ text: `Fecha: ${documento.fecha || '____/____/______'}      N° de historia: ${documento.numero || '__________'}`, size: TAM })] }),
  ];

  for (const b of documento.bloques) {
    if (b.tipo === 'seccion') {
      cuerpo.push(new Paragraph({ spacing: { before: 240, after: 80 }, children: [new TextRun({ text: b.titulo, bold: true, size: 24 })] }));
    } else if (b.tipo === 'grupo') {
      cuerpo.push(new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: b.titulo, bold: true, size: 20 })] }));
      if (b.subtitulo) cuerpo.push(new Paragraph({ children: [new TextRun({ text: b.subtitulo, italics: true, size: 16 })] }));
    } else if (b.tipo === 'casillas') {
      const runs = [];
      for (const item of b.items) {
        const detalles = item.detalles.map((d) => ` ${d.etiqueta}: ${d.valor || '__________'}`).join('');
        runs.push(new TextRun({ text: `${item.marcado ? MARCADA : VACIA} `, font: 'Segoe UI Symbol', size: TAM }));
        runs.push(new TextRun({ text: `${item.etiqueta}${detalles}     `, size: TAM }));
      }
      cuerpo.push(new Paragraph({ children: runs }));
    } else if (b.tipo === 'etiqueta') {
      cuerpo.push(new Paragraph({ children: [new TextRun({ text: `${b.texto}:`, bold: true, size: TAM })] }));
    } else if (b.tipo === 'campo') {
      cuerpo.push(new Paragraph({
        children: [new TextRun({ text: `${b.etiqueta}: `, bold: true, size: TAM }), new TextRun({ text: b.valor || '______________________________', size: TAM })],
      }));
    } else if (b.tipo === 'parrafo') {
      cuerpo.push(new Paragraph({ children: [new TextRun({ text: `${b.etiqueta}:`, bold: true, size: TAM })] }));
      const lineas = b.valor ? b.valor.split('\n') : ['_'.repeat(90), '_'.repeat(90)];
      for (const linea of lineas) cuerpo.push(new Paragraph({ children: [new TextRun({ text: linea, size: TAM })] }));
    } else if (b.tipo === 'tabla') {
      cuerpo.push(tabla(b.columnas, b.filas));
      cuerpo.push(new Paragraph({ children: [] }));
    } else if (b.tipo === 'compromiso') {
      cuerpo.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: b.texto, size: TAM })] }));
    } else if (b.tipo === 'firmas') {
      cuerpo.push(new Paragraph({ spacing: { before: 1200 }, children: [] }));
      cuerpo.push(tabla(['Firma del paciente', 'Firma del especialista'], [['C.I.', 'C.I.']]));
    }
  }

  const doc = new Document({ sections: [{ headers: { default: encabezado(config) }, children: cuerpo }] });
  return Packer.toBuffer(doc);
}

module.exports = { generarHistoriaWord };

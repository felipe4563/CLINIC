const PDFDocument = require('pdfkit');
const { rutaLogoEmbebible, MARCA: C, telefonoLegible: telefono } = require('./pdf');

// Hoja de agenda para imprimir y tener en recepción: la hora grande a la
// izquierda, la paciente y su servicio, el teléfono a mano y una casilla para
// marcar a mano quién llegó. Colores de la marca, que en B/N quedan en grises.

const ESTADO = {
  pendiente_pago: 'Por pagar',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  completada: 'Completada',
  no_asistio: 'No asistió',
};

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function fechaLarga(iso, conAnio = true) {
  const [a, m, d] = iso.split('-').map(Number);
  const dia = DIAS[new Date(a, m - 1, d).getDay()];
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${d} de ${MESES[m - 1]}${conAnio ? ` de ${a}` : ''}`;
}

const hhmm = (t) => String(t || '').slice(0, 5);

function minutos(desde, hasta) {
  const [h1, m1] = hhmm(desde).split(':').map(Number);
  const [h2, m2] = hhmm(hasta).split(':').map(Number);
  return h2 * 60 + m2 - (h1 * 60 + m1);
}

// citas: objetos con fecha, hora_inicio, hora_fin, estado, Paciente, Servicio, Profesional.
function generarAgendaPDF(res, config, { citas, desde, hasta, profesional, nombreArchivo }) {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 44, bottom: 54, left: 44, right: 44 }, bufferPages: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
  doc.pipe(res);

  const izq = doc.page.margins.left;
  const ancho = doc.page.width - izq - doc.page.margins.right;
  const der = izq + ancho;
  const limite = () => doc.page.height - doc.page.margins.bottom;
  const esRango = desde !== hasta;

  // --- Encabezado: logo y clínica a la izquierda, la fecha a la derecha ---
  let y = doc.page.margins.top;
  const logo = rutaLogoEmbebible(config.logo_url);
  let xTexto = izq;
  if (logo) {
    try {
      const img = doc.openImage(logo);
      const alto = 46;
      const anchoLogo = Math.min(120, alto * (img.width / img.height));
      doc.image(logo, izq, y, { width: anchoLogo, height: alto });
      xTexto = izq + anchoLogo + 12;
    } catch {
      // Logo ilegible: se sigue sin él.
    }
  }
  const anchoClinica = izq + 240 - xTexto;
  doc.font('Times-Roman').fontSize(20).fillColor(C.espresso).text(config.nombre_consultorio || 'Clínica', xTexto, y + 4, { width: anchoClinica, height: 24, ellipsis: true, lineBreak: false });
  const contacto = [config.telefono, config.direccion].filter(Boolean).join('  ·  ');
  if (contacto) doc.font('Helvetica').fontSize(7.5).fillColor(C.muted).text(contacto, xTexto, y + 30, { width: anchoClinica, height: 20, ellipsis: true });

  const anioDesde = desde.slice(0, 4);
  const etiqueta = esRango ? 'AGENDA DE CITAS' : `AGENDA DEL DÍA  ·  ${anioDesde}`;
  doc.font('Helvetica').fontSize(7.5).fillColor(C.tan).text(etiqueta, izq, y + 2, { width: ancho, align: 'right', characterSpacing: 1.6 });
  const xFecha = izq + 250;
  if (esRango) {
    doc.font('Times-Roman').fontSize(13).fillColor(C.ink).text(fechaLarga(desde), xFecha, y + 14, { width: der - xFecha, align: 'right' });
    doc.text(`al ${fechaLarga(hasta)}`, xFecha, doc.y, { width: der - xFecha, align: 'right' });
  } else {
    doc.font('Times-Roman').fontSize(21).fillColor(C.ink).text(fechaLarga(desde, false), xFecha, y + 14, { width: der - xFecha, align: 'right' });
  }

  y = Math.max(y + 58, doc.y + 8);
  doc.moveTo(izq, y).lineTo(der, y).lineWidth(1.2).strokeColor(C.espresso).stroke();
  y += 14;

  // --- Resumen ---
  const activas = citas.filter((c) => c.estado !== 'cancelada');
  const resumen = [
    ['Citas', String(activas.length)],
    ['Confirmadas', String(citas.filter((c) => c.estado === 'confirmada' || c.estado === 'completada').length)],
    ['Por pagar', String(citas.filter((c) => c.estado === 'pendiente_pago').length)],
    ['Profesional', profesional || 'Todos'],
  ];
  const anchoCaja = (ancho - 3 * 8) / 4;
  resumen.forEach(([etiqueta, valor], i) => {
    const x = izq + i * (anchoCaja + 8);
    doc.roundedRect(x, y, anchoCaja, 42, 6).fill(C.suave);
    doc.font('Helvetica').fontSize(6.8).fillColor(C.muted).text(etiqueta.toUpperCase(), x + 10, y + 8, { width: anchoCaja - 20, characterSpacing: 1 });
    const esTexto = i === 3;
    doc.font(esTexto ? 'Helvetica-Bold' : 'Times-Roman').fontSize(esTexto ? 9.5 : 18).fillColor(C.ink)
      .text(valor, x + 10, y + (esTexto ? 23 : 18), { width: anchoCaja - 20, height: 14, ellipsis: true, lineBreak: !esTexto });
  });
  y += 42 + 18;

  // --- Citas ---
  const xHora = izq;
  const xCuerpo = izq + 70;
  const xEstado = der - 150;
  const xLlego = der - 44;

  function encabezadoColumnas() {
    doc.font('Helvetica').fontSize(6.8).fillColor(C.muted);
    doc.text('HORA', xHora, y, { characterSpacing: 1 });
    doc.text('PACIENTE Y SERVICIO', xCuerpo, y, { characterSpacing: 1 });
    doc.text('ESTADO', xEstado, y, { characterSpacing: 1 });
    doc.text('LLEGÓ', xLlego - 4, y, { width: 48, align: 'center', characterSpacing: 1 });
    y += 13;
    doc.moveTo(izq, y).lineTo(der, y).lineWidth(0.6).strokeColor(C.linea).stroke();
  }

  function nuevaPagina() {
    doc.addPage();
    y = doc.page.margins.top;
    encabezadoColumnas();
  }

  function tituloDia(fecha) {
    if (y + 70 > limite()) nuevaPagina();
    y += 10;
    doc.font('Times-Roman').fontSize(13).fillColor(C.espresso).text(fechaLarga(fecha), izq, y);
    y = doc.y + 4;
    doc.moveTo(izq, y).lineTo(der, y).lineWidth(0.6).strokeColor(C.linea).stroke();
  }

  if (citas.length === 0) {
    doc.roundedRect(izq, y, ancho, 90, 8).lineWidth(0.8).dash(3, { space: 3 }).strokeColor(C.linea).stroke().undash();
    doc.font('Times-Roman').fontSize(15).fillColor(C.espresso).text('No hay citas agendadas', izq, y + 28, { width: ancho, align: 'center' });
    doc.font('Helvetica').fontSize(8.5).fillColor(C.muted).text(esRango ? 'en este periodo.' : 'para este día.', izq, doc.y + 2, { width: ancho, align: 'center' });
  } else {
    encabezadoColumnas();
    let fechaActual = null;
    citas.forEach((c) => {
      if (esRango && c.fecha !== fechaActual) {
        fechaActual = c.fecha;
        tituloDia(c.fecha);
      }
      const alto = 50;
      if (y + alto > limite()) nuevaPagina();
      const cancelada = c.estado === 'cancelada';
      const tono = cancelada ? C.muted : C.ink;
      const yFila = y + 9;

      // Hora
      doc.font('Times-Bold').fontSize(16).fillColor(cancelada ? C.muted : C.espresso).text(hhmm(c.hora_inicio), xHora, yFila, { width: 64 });
      const dur = minutos(c.hora_inicio, c.hora_fin);
      doc.font('Helvetica').fontSize(7.5).fillColor(C.muted).text(`a ${hhmm(c.hora_fin)}${dur > 0 ? ` · ${dur} min` : ''}`, xHora, yFila + 19, { width: 64 });

      // Paciente, servicio, contacto
      const anchoCuerpo = xEstado - xCuerpo - 12;
      const p = c.Paciente;
      doc.font('Helvetica-Bold').fontSize(10.5).fillColor(tono).text(p ? p.nombre_completo : 'Sin paciente', xCuerpo, yFila, { width: anchoCuerpo, height: 13, ellipsis: true, lineBreak: false });
      const servicio = [c.Servicio ? c.Servicio.nombre : 'Sin servicio', !profesional && c.Profesional ? c.Profesional.nombre : null].filter(Boolean).join('  ·  ');
      doc.font('Helvetica').fontSize(8.5).fillColor(tono).text(servicio, xCuerpo, yFila + 14, { width: anchoCuerpo, height: 11, ellipsis: true, lineBreak: false });
      const datos = [p && p.telefono ? `Tel. ${telefono(p.telefono)}` : null, p && p.codigo_paciente ? p.codigo_paciente : null].filter(Boolean).join('   ·   ');
      if (datos) doc.font('Helvetica').fontSize(7.5).fillColor(C.muted).text(datos, xCuerpo, yFila + 26, { width: anchoCuerpo, lineBreak: false });

      // Estado: etiqueta con borde (se lee igual en B/N)
      const textoEstado = ESTADO[c.estado] || c.estado;
      doc.font('Helvetica-Bold').fontSize(7.5);
      const anchoEtiqueta = doc.widthOfString(textoEstado) + 16;
      const relleno = c.estado === 'confirmada' || c.estado === 'completada';
      doc.roundedRect(xEstado, yFila + 1, anchoEtiqueta, 15, 7.5).lineWidth(0.8);
      if (relleno) doc.fillAndStroke(C.espresso, C.espresso);
      else doc.strokeColor(cancelada ? C.linea : C.tan).stroke();
      doc.fillColor(relleno ? C.blanco : cancelada ? C.muted : C.tan).text(textoEstado, xEstado + 8, yFila + 5, { lineBreak: false });

      // Casilla para marcar a mano
      if (!cancelada) doc.roundedRect(xLlego + 8, yFila + 1, 14, 14, 2.5).lineWidth(0.9).strokeColor(C.tan).stroke();

      y += alto;
      doc.moveTo(izq, y).lineTo(der, y).lineWidth(0.5).strokeColor(C.linea).stroke();
    });

    // Notas a mano al final, si queda lugar
    if (y + 80 <= limite()) {
      y += 18;
      doc.font('Helvetica').fontSize(6.8).fillColor(C.muted).text('NOTAS', izq, y, { characterSpacing: 1 });
      for (let i = 0; i < 3; i += 1) {
        y += 20;
        doc.moveTo(izq, y).lineTo(der, y).lineWidth(0.5).strokeColor(C.linea).stroke();
      }
    }
  }

  // --- Pie en cada página: frase de la clínica, cuándo se imprimió y página X de N ---
  const generado = new Date().toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
  const rango = doc.bufferedPageRange();
  for (let i = 0; i < rango.count; i += 1) {
    doc.switchToPage(rango.start + i);
    const margenInferior = doc.page.margins.bottom;
    doc.page.margins.bottom = 0; // el pie va dentro del margen: sin esto pdfkit abre otra página
    const yPie = doc.page.height - 34;
    doc.moveTo(izq, yPie - 8).lineTo(der, yPie - 8).lineWidth(0.5).strokeColor(C.linea).stroke();
    doc.font('Helvetica').fontSize(7).fillColor(C.muted);
    doc.text(config.pie_pdf || config.nombre_consultorio || '', izq, yPie, { width: ancho / 2, lineBreak: false });
    doc.text(`Impreso ${generado}   ·   Página ${i + 1} de ${rango.count}`, izq + ancho / 2, yPie, { width: ancho / 2, align: 'right', lineBreak: false });
    doc.page.margins.bottom = margenInferior;
  }

  doc.end();
}

module.exports = { generarAgendaPDF };

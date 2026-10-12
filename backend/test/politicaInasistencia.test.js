const {
  HORAS_PARA_JUSTIFICAR,
  DIAS_PARA_REPROGRAMAR,
  TEXTO_POR_DEFECTO,
  plazos,
  conPolitica,
} = require('../src/services/politicaInasistencia');

function cita(extra = {}) {
  return {
    fecha: '2026-10-19',
    hora_inicio: '10:30:00',
    estado: 'no_asistio',
    justificacion_estado: null,
    justificacion_registrada_en: null,
    reprogramacion_usada: false,
    Pago: { metodo_adelanto: 'qr_fijo', estado: 'pagado' },
    ...extra,
  };
}

describe('politicaInasistencia', () => {
  test('constantes y texto por defecto', () => {
    expect(HORAS_PARA_JUSTIFICAR).toBe(48);
    expect(DIAS_PARA_REPROGRAMAR).toBe(30);
    expect(TEXTO_POR_DEFECTO).toContain('pierdes el monto depositado');
    expect(TEXTO_POR_DEFECTO).toContain('48 horas');
    expect(TEXTO_POR_DEFECTO).toContain('30 días');
  });

  test('el límite para justificar es la hora de la cita + 48 h (hora local)', () => {
    const p = plazos(cita(), new Date(2026, 9, 20, 9, 0));
    expect(new Date(p.limiteJustificar).getTime()).toBe(new Date(2026, 9, 21, 10, 30).getTime());
    expect(p.justificacionFueraDePlazo).toBe(false);
    expect(p.puedeJustificar).toBe(true);
    expect(p.montoRetenido).toBe(true);
  });

  test('pasadas las 48 h queda fuera de plazo pero sigue pudiendo justificarse', () => {
    const p = plazos(cita(), new Date(2026, 9, 21, 10, 31));
    expect(p.justificacionFueraDePlazo).toBe(true);
    expect(p.puedeJustificar).toBe(true);
  });

  test('sin pago adelantado no hay monto retenido ni justificación', () => {
    const p = plazos(cita({ Pago: { metodo_adelanto: null, estado: 'pagado' } }));
    expect(p.conAdelanto).toBe(false);
    expect(p.montoRetenido).toBe(false);
    expect(p.puedeJustificar).toBe(false);
  });

  test('un pago fallido no cuenta como adelanto', () => {
    expect(plazos(cita({ Pago: { metodo_adelanto: 'qr_fijo', estado: 'fallido' } })).conAdelanto).toBe(false);
  });

  test('justificación aceptada: puede reprogramar durante 30 días, y ya no hay monto retenido', () => {
    const registrada = new Date(2026, 9, 20, 12, 0);
    const c = cita({ justificacion_estado: 'aceptada', justificacion_registrada_en: registrada.toISOString() });
    const dentro = plazos(c, new Date(2026, 10, 18, 12, 0));
    expect(dentro.puedeReprogramar).toBe(true);
    expect(dentro.puedeJustificar).toBe(false);
    expect(dentro.montoRetenido).toBe(false);
    expect(new Date(dentro.limiteReprogramar).getTime()).toBe(registrada.getTime() + 30 * 24 * 3600 * 1000);
    expect(dentro.reprogramacionFueraDePlazo).toBe(false);
    expect(plazos(c, new Date(2026, 10, 20, 12, 0)).reprogramacionFueraDePlazo).toBe(true);
  });

  test('justificación rechazada: el monto sigue retenido y no puede reprogramar', () => {
    const p = plazos(cita({ justificacion_estado: 'rechazada', justificacion_registrada_en: new Date().toISOString() }));
    expect(p.montoRetenido).toBe(true);
    expect(p.puedeReprogramar).toBe(false);
  });

  test('ya reprogramada una vez: no puede volver a reprogramar', () => {
    const p = plazos(cita({ justificacion_estado: 'aceptada', justificacion_registrada_en: new Date().toISOString(), reprogramacion_usada: true }));
    expect(p.puedeReprogramar).toBe(false);
  });

  test('conPolitica oculta los nombres de archivo y agrega banderas', () => {
    const json = conPolitica({
      ...cita({ justificacion_archivo: 'abc.pdf' }),
      Pago: { metodo_adelanto: 'qr_fijo', estado: 'pagado', comprobante_archivo: 'x.png' },
    });
    expect(json.Pago.comprobante_archivo).toBeUndefined();
    expect(json.Pago.tieneComprobante).toBe(true);
    expect(json.justificacion_archivo).toBeUndefined();
    expect(json.tieneJustificacion).toBe(true);
    expect(json.politica.montoRetenido).toBe(true);
  });

  test('conPolitica acepta una cita sin Pago', () => {
    const json = conPolitica({ ...cita(), Pago: null });
    expect(json.Pago).toBeNull();
    expect(json.politica.conAdelanto).toBe(false);
  });
});

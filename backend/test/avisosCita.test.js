jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn(),
}));

const { enviarPlantillaWhatsApp } = require('../src/services/whatsapp');
const { enviarConfirmacionCita, enviarAvisoCita } = require('../src/services/avisosCita');

describe('avisosCita', () => {
  const original = process.env.WHATSAPP_AVISO_TEMPLATE;
  afterEach(() => {
    enviarPlantillaWhatsApp.mockReset();
    if (original === undefined) delete process.env.WHATSAPP_AVISO_TEMPLATE;
    else process.env.WHATSAPP_AVISO_TEMPLATE = original;
  });

  test('confirmación: usa cita_confirmada con [fecha, hora]', async () => {
    enviarPlantillaWhatsApp.mockResolvedValue(undefined);
    expect(await enviarConfirmacionCita('59170000001', '2026-10-19', '10:30')).toBe('enviado');
    expect(enviarPlantillaWhatsApp).toHaveBeenCalledWith('59170000001', 'cita_confirmada', ['2026-10-19', '10:30']);
  });

  test('confirmación: si WhatsApp falla devuelve error y no lanza', async () => {
    enviarPlantillaWhatsApp.mockRejectedValue(new Error('caído'));
    expect(await enviarConfirmacionCita('59170000001', '2026-10-19', '10:30')).toBe('error');
  });

  test('aviso: sin plantilla configurada no envía', async () => {
    delete process.env.WHATSAPP_AVISO_TEMPLATE;
    expect(await enviarAvisoCita({ telefono: '1', nombre: 'Ana', fecha: '2026-10-19', hora: '10:30', mensaje: 'x' })).toBe('no_configurado');
    expect(enviarPlantillaWhatsApp).not.toHaveBeenCalled();
  });

  test('aviso: con plantilla envía [nombre, "fecha hora", mensaje]', async () => {
    process.env.WHATSAPP_AVISO_TEMPLATE = 'aviso_cita';
    enviarPlantillaWhatsApp.mockResolvedValue(undefined);
    expect(await enviarAvisoCita({ telefono: '1', nombre: 'Ana', fecha: '2026-10-19', hora: '10:30', mensaje: 'anulada' })).toBe('enviado');
    expect(enviarPlantillaWhatsApp).toHaveBeenCalledWith('1', 'aviso_cita', ['Ana', '2026-10-19 10:30', 'anulada']);
  });
});

jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn(),
  whatsappConfigurado: () => true,
  normalizarTelefono: (t) => t,
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

  const confirmacion = { telefono: '59170000001', nombre: 'Ana Rojas', servicio: 'Microneedling', fecha: '2026-10-19', hora: '10:30:00' };

  test('confirmación: usa cita_confirmada con [nombre, servicio, fecha legible, hora]', async () => {
    enviarPlantillaWhatsApp.mockResolvedValue(undefined);
    expect(await enviarConfirmacionCita(confirmacion)).toBe('enviado');
    expect(enviarPlantillaWhatsApp).toHaveBeenCalledWith('59170000001', 'cita_confirmada', ['Ana Rojas', 'Microneedling', 'lunes 19 de octubre', '10:30']);
  });

  test('confirmación: si WhatsApp falla devuelve error y no lanza', async () => {
    enviarPlantillaWhatsApp.mockRejectedValue(new Error('caído'));
    expect(await enviarConfirmacionCita(confirmacion)).toBe('error');
  });

  test('aviso: sin plantilla configurada no envía', async () => {
    delete process.env.WHATSAPP_AVISO_TEMPLATE;
    expect(await enviarAvisoCita({ telefono: '1', nombre: 'Ana', fecha: '2026-10-19', hora: '10:30', mensaje: 'x' })).toBe('no_configurado');
    expect(enviarPlantillaWhatsApp).not.toHaveBeenCalled();
  });

  test('aviso: con plantilla envía [nombre, "fecha a las hora", mensaje]', async () => {
    process.env.WHATSAPP_AVISO_TEMPLATE = 'aviso_cita';
    enviarPlantillaWhatsApp.mockResolvedValue(undefined);
    expect(await enviarAvisoCita({ telefono: '1', nombre: 'Ana', fecha: '2026-10-19', hora: '10:30', mensaje: 'anulada' })).toBe('enviado');
    expect(enviarPlantillaWhatsApp).toHaveBeenCalledWith('1', 'aviso_cita', ['Ana', 'lunes 19 de octubre a las 10:30', 'anulada']);
  });
});

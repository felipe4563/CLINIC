const { test, expect } = require('@playwright/test');
const path = require('path');
const BACKEND_DIR = path.join(__dirname, '..', '..', 'backend');
require(path.join(BACKEND_DIR, 'node_modules', 'dotenv')).config({ path: path.join(BACKEND_DIR, '.env') });
const db = require(path.join(BACKEND_DIR, 'src', 'models'));

// Flujo critico: un paciente nuevo reserva una cita completa (sin OTP --
// la "primera vez" registra directo). No llega hasta pagar el QR porque
// eso depende de credenciales reales del Banco Economico que no existen
// en desarrollo; la reserva ya esta hecha antes de esa pantalla, que es lo
// que este test verifica (en la API, no solo en la UI).
//
// Requiere que la base de datos de desarrollo tenga al menos un servicio
// con un profesional y horarios asignados (los que crea `npm run seed`
// en backend/).

test('un paciente nuevo reserva una cita de principio a fin', async ({ page }) => {
  const telefono = `591700${Date.now().toString().slice(-5)}`;

  await page.goto('/');
  await page.getByRole('button', { name: 'Reservar Consulta' }).first().click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Elige un servicio')).toBeVisible();
  await dialog.locator('button', { hasText: 'Bs.' }).first().click();

  await expect(dialog.getByText('Elige un profesional')).toBeVisible();
  await dialog.locator('ul button').first().click();

  await expect(dialog.getByText('Elige fecha y horario')).toBeVisible();
  // Un lunes futuro: el seed de horarios solo cubre dias de semana (1-5),
  // y elegir una fecha fija podria caer en fin de semana segun el dia real.
  const proximoLunes = new Date();
  proximoLunes.setDate(proximoLunes.getDate() + ((1 - proximoLunes.getDay() + 7) % 7 || 7));
  const fecha = proximoLunes.toISOString().slice(0, 10);
  await dialog.locator('input[type="date"]').fill(fecha);
  await expect(dialog.getByText('No hay horarios disponibles')).not.toBeVisible({ timeout: 8000 });
  await dialog.locator('ul button').first().click();

  await expect(dialog.getByText('Ingresa tus datos')).toBeVisible();
  await dialog.getByPlaceholder('Nombre completo').fill('Paciente E2E');
  await dialog.getByPlaceholder('Teléfono (con código de país)').fill(telefono);
  await dialog.getByPlaceholder('Carnet de identidad').fill('9999999');
  await dialog.getByPlaceholder('Expedido (ej. CB)').fill('CB');
  await dialog.getByRole('button', { name: 'Continuar a la reserva' }).click();

  await expect(dialog.getByText('Confirmar reserva')).toBeVisible();
  await dialog.getByRole('button', { name: /Confirmar/ }).click();

  // La pantalla siguiente es la de pago con QR (o error de QR si el banco
  // no esta configurado en este entorno) -- en ambos casos ya salimos de
  // "Confirmar reserva", que es la senal de que POST /citas funciono.
  await expect(dialog.getByText('Confirmar reserva')).not.toBeVisible();

  const paciente = await db.Paciente.findOne({ where: { telefono } });
  expect(paciente).not.toBeNull();
  const cita = await db.Cita.findOne({ where: { paciente_id: paciente.id } });
  expect(cita).not.toBeNull();
  const pago = await db.Pago.findOne({ where: { cita_id: cita.id } });
  expect(pago).not.toBeNull();
});

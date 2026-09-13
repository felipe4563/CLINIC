const { test, expect } = require('@playwright/test');
const path = require('path');
const BACKEND_DIR = path.join(__dirname, '..', '..', 'backend');
require(path.join(BACKEND_DIR, 'node_modules', 'dotenv')).config({ path: path.join(BACKEND_DIR, '.env') });
const bcrypt = require(path.join(BACKEND_DIR, 'node_modules', 'bcryptjs'));
const db = require(path.join(BACKEND_DIR, 'src', 'models'));
const { PERMISOS_POR_DEFECTO } = require(path.join(BACKEND_DIR, 'src', 'config', 'permisos'));

const EMAIL = 'e2e-admin@clinicnovaged.test';
const PASSWORD = 'e2e-test-password-123';

test.beforeAll(async () => {
  const [rol] = await db.Rol.findOrCreate({
    where: { nombre: 'Admin' },
    defaults: { permisos: PERMISOS_POR_DEFECTO.Admin },
  });
  const password_hash = await bcrypt.hash(PASSWORD, 10);
  const [usuario, creado] = await db.Usuario.findOrCreate({
    where: { email: EMAIL },
    defaults: { nombre: 'E2E Admin', password_hash, rol_id: rol.id },
  });
  if (!creado) {
    usuario.password_hash = password_hash;
    usuario.activo = true;
    await usuario.save();
  }
});

// Flujo critico: login del personal y llegada al dashboard. Usa un usuario
// Admin de prueba propio (creado arriba), no depende de credenciales reales
// de nadie.
test('el personal inicia sesion y llega al dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
});

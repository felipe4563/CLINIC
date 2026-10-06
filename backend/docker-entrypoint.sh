#!/bin/sh
set -e

npx sequelize-cli db:migrate
node src/scripts/seedAdmin.js

# Datos de demo (pacientes, citas, ventas, etc.) son opt-in: solo se cargan
# si SEED_DEMO_DATA=true en el .env. El script mismo es idempotente (no
# duplica datos si ya existen citas), pero lo dejamos detrás de una variable
# para que un despliegue de producción real con pacientes reales nunca los
# genere por accidente.
if [ "$SEED_DEMO_DATA" = "true" ]; then
  node src/seedDemoSemana.js
fi

exec node src/server.js

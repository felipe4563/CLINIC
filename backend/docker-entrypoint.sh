#!/bin/sh
set -e

npx sequelize-cli db:migrate
node src/scripts/seedAdmin.js

# Los datos de demo (npm run seed:demo) nunca se cargan al arrancar: en
# producción llegaron a cargarse solos cuando se vaciaron las citas. Se
# corren solo a mano, contra una base de pruebas.

exec node src/server.js

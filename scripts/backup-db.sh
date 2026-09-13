#!/usr/bin/env bash
# Backup diario de la base de datos de produccion (MySQL corriendo en Docker).
# Uso: ./scripts/backup-db.sh
# Pensado para correr por cron en el VPS. Ver el cron de ejemplo mas abajo.
#
# Guarda un .sql.gz con fecha en ./backups/ (fuera de git) y borra los que
# tengan mas de RETENCION_DIAS dias.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

RETENCION_DIAS=14
DIR_BACKUPS="./backups"
FECHA=$(date +%Y%m%d-%H%M%S)
ARCHIVO="$DIR_BACKUPS/novaged-$FECHA.sql.gz"

mkdir -p "$DIR_BACKUPS"

if [ ! -f .env ]; then
  echo "No se encontro .env en la raiz del repo (falta DB_PASSWORD). Abortando." >&2
  exit 1
fi
DB_PASSWORD=$(grep -E '^DB_PASSWORD=' .env | head -1 | cut -d '=' -f2-)
if [ -z "$DB_PASSWORD" ]; then
  echo "DB_PASSWORD vacio en .env. Abortando." >&2
  exit 1
fi

echo "==> Generando backup en $ARCHIVO ..."
docker compose exec -T mysql mysqldump -u novaged -p"$DB_PASSWORD" --single-transaction novaged | gzip > "$ARCHIVO"

echo "==> Backup listo ($(du -h "$ARCHIVO" | cut -f1))"

echo "==> Borrando backups de mas de $RETENCION_DIAS dias..."
find "$DIR_BACKUPS" -name 'novaged-*.sql.gz' -mtime +"$RETENCION_DIAS" -delete

echo "==> Backups actuales:"
ls -lh "$DIR_BACKUPS"

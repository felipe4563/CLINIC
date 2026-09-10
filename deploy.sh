#!/usr/bin/env bash
# Actualiza y redespliega el sistema en el VPS.
# Uso: ./deploy.sh
#
# Qué hace:
#   1. Trae los últimos cambios de git (rama actual).
#   2. Reconstruye las imágenes que hayan cambiado.
#   3. Recrea solo los contenedores afectados (sin downtime de los que no cambiaron).
#   4. Limpia imágenes viejas sin usar.
#
# No toca la config de nginx del sistema ni los certificados HTTPS: eso vive
# fuera de este repo, en /etc/nginx/ del VPS (ver nginx/*.conf para la
# plantilla usada en el primer despliegue).

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

echo "==> Verificando que no haya cambios locales sin commitear..."
if [ -n "$(git status --porcelain)" ]; then
  echo "Hay cambios locales sin commitear en el servidor. Abortando para no perderlos:"
  git status --porcelain
  exit 1
fi

RAMA=$(git rev-parse --abbrev-ref HEAD)
echo "==> Actualizando rama '$RAMA' desde origin..."
git fetch origin
git pull --ff-only origin "$RAMA"

echo "==> Construyendo imágenes actualizadas..."
docker compose build

echo "==> Recreando contenedores con las imágenes nuevas..."
docker compose up -d --remove-orphans

echo "==> Limpiando imágenes viejas sin usar..."
docker image prune -f

echo "==> Estado actual de los servicios:"
docker compose ps

echo "==> Últimos logs de la API (Ctrl+C para salir):"
docker compose logs -f --tail=50 api

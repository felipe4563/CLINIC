#!/usr/bin/env bash
# Actualiza y redespliega el sistema en el VPS.
# Uso: ./deploy.sh
#
# Qué hace:
#   1. Trae los últimos cambios de git (rama actual).
#   2. Descarga de ghcr.io las imágenes de ese commit. Las construye GitHub
#      Actions (.github/workflows/imagenes.yml) con cada push a main: el VPS
#      no construye nada, así que no gasta RAM ni CPU. Si Actions todavía no
#      terminó, espera hasta 15 minutos.
#   3. Recrea solo los contenedores afectados (sin downtime de los que no cambiaron).
#      Al arrancar, el contenedor api corre las migraciones pendientes solo
#      (ver backend/Dockerfile) -- no hace falta correrlas a mano despues
#      de la primera vez que se bautizo la base existente (ver
#      backend/src/scripts/baselineMigrations.js).
#   4. Limpia imágenes viejas sin usar.
#
# Volver a una versión anterior: TAG=<sha del commit> docker compose up -d
#
# No toca la config de nginx del sistema ni los certificados HTTPS: eso vive
# fuera de este repo, en /etc/nginx/ del VPS (ver nginx/*.conf para la
# plantilla usada en el primer despliegue).

set -euo pipefail

# Todo va dentro de main: bash lee el script entero antes de ejecutarlo, así
# el git pull de abajo puede cambiar este mismo archivo sin romper la
# ejecución en curso.
main() {
  cd "$(dirname "${BASH_SOURCE[0]}")"

  echo "==> Verificando que no haya cambios sin commitear en archivos versionados..."
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Hay cambios locales sin commitear en el servidor. Abortando para no perderlos:"
    git status --porcelain --untracked-files=no
    exit 1
  fi

  local rama
  rama=$(git rev-parse --abbrev-ref HEAD)
  echo "==> Actualizando rama '$rama' desde origin..."
  git fetch origin
  git pull --ff-only origin "$rama"

  export TAG
  TAG=$(git rev-parse HEAD)
  echo "==> Descargando imágenes del commit ${TAG:0:7} desde ghcr.io..."
  local intento
  for intento in $(seq 1 30); do
    if docker compose pull --quiet api staff public-site 2>/dev/null; then
      break
    fi
    if [ "$intento" -eq 30 ]; then
      echo "Las imágenes del commit ${TAG:0:7} no aparecieron en ghcr.io."
      echo "Revisa GitHub -> Actions: el build pudo haber fallado."
      echo "Producción sigue con la versión anterior."
      exit 1
    fi
    echo "    Todavía no están (¿GitHub Actions sigue construyendo?). Reintento en 30 s... ($intento/30)"
    sleep 30
  done

  echo "==> Recreando contenedores con las imágenes nuevas..."
  docker compose up -d --no-build --remove-orphans

  # Solo las de este sistema (por su etiqueta): las de los otros sistemas del
  # VPS no se tocan. Las que usan los contenedores en marcha tampoco.
  echo "==> Limpiando imágenes viejas sin usar..."
  docker image prune -af --filter "label=org.opencontainers.image.source=https://github.com/felipe4563/CLINIC"
  docker image prune -f

  echo "==> Estado actual de los servicios:"
  docker compose ps

  echo "==> Últimos logs de la API (Ctrl+C para salir):"
  docker compose logs -f --tail=50 api
}

main "$@"

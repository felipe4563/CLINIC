# Deploy con imágenes en ghcr.io (CI/CD con GitHub Actions)

## Cómo se llama

**CI/CD con GitHub Actions y GitHub Container Registry (ghcr.io)**. El patrón
también se conoce como *build en CI, pull en el servidor* o *deploy basado en
registro de imágenes*.

- **CI** (integración continua): GitHub construye las imágenes Docker con cada
  push.
- **Registro**: las imágenes se guardan en `ghcr.io/<usuario>/<proyecto>-<servicio>`.
- **CD** (despliegue): el VPS no construye nada. Solo descarga la imagen del
  commit y levanta los contenedores.

**Por qué conviene:** el VPS no gasta RAM ni CPU en builds (en un VPS
compartido, dos builds de Next.js en paralelo lo dejaban sin memoria). El
deploy baja de varios minutos a menos de uno. Si el build falla, falla en
GitHub y producción sigue con la versión anterior.

En este repo quedó en:

- `.github/workflows/imagenes.yml`: construye y publica.
- `docker-compose.yml`: `image: ghcr.io/...:${TAG:-latest}`.
- `deploy.sh`: `git pull`, `docker compose pull` y `up -d`.
- `backend/.dockerignore`: excluye uploads y SQL.

---

## Prompt para repetirlo en otro proyecto

Copiar, completar lo que está entre `< >` y pegarlo en Claude Code dentro del
otro proyecto:

```text
Quiero pasar el deploy de este proyecto a CI/CD con GitHub Actions + ghcr.io,
igual que hicimos en Clinic NovagED:

- Hoy el VPS hace `docker compose build` en cada deploy y se queda sin RAM
  (VPS compartido con otros sistemas, sin swap o con poca).
- Repo en GitHub: <usuario>/<repo>, rama <main>, visibilidad <pública/privada>.
- Servicios a construir: <api, frontend, ...> (los que tienen `build:` en
  docker-compose.yml). La base de datos sigue usando su imagen oficial.

Qué necesito:

1. `.github/workflows/imagenes.yml`: en cada push a la rama, construir cada
   servicio en paralelo (matrix) y subirlo a
   ghcr.io/<usuario>/<proyecto>-<servicio>, con dos etiquetas: el SHA completo
   del commit y `latest`. Caché de GitHub (type=gha) por servicio, cancelar
   builds viejos si llegan dos push seguidos, login con GITHUB_TOKEN, y la
   etiqueta org.opencontainers.image.source apuntando al repo.
2. `docker-compose.yml`: cada servicio con
   `image: ghcr.io/...:${TAG:-latest}`, manteniendo `build:` para construir a
   mano si hace falta.
3. `deploy.sh`:
   - todo dentro de una función main(), para que el git pull no rompa el
     script mientras corre;
   - verificar que no haya cambios sin commitear;
   - git pull --ff-only;
   - exportar TAG con el SHA del commit actual;
   - `docker compose pull` solo de nuestros servicios, reintentando cada 30 s
     hasta 15 min si GitHub Actions todavía no terminó;
   - si no aparecen, abortar diciendo que producción sigue con la versión
     anterior;
   - `docker compose up -d --no-build --remove-orphans`;
   - limpiar solo las imágenes viejas de ESTE proyecto (filtrar por la
     etiqueta org.opencontainers.image.source) sin tocar las de otros
     sistemas del VPS.
4. Revisar los .dockerignore de cada servicio: que nunca entren .env, uploads,
   archivos .sql, respaldos ni datos de clientes, porque las imágenes pueden
   quedar públicas. Construir la imagen localmente y listar su contenido para
   confirmarlo.
5. Revisar si algún frontend necesita variables en tiempo de build (por
   ejemplo NEXT_PUBLIC_* en Next.js, VITE_* en Vite). En CI no existe el
   .env del servidor, así que hay que pasarlas como build-args o usar rutas
   relativas como /api.
6. Revisar cómo corren las migraciones (al arrancar el contenedor o a mano) y
   que el nuevo flujo no las salte.
7. Validar: bash -n deploy.sh, docker compose config con TAG, YAML del
   workflow, y si se puede, docker compose build local de todo.

No hagas commit ni push. Al final dime los pasos manuales que me tocan a mí.
```

---

## Pasos manuales (una sola vez por proyecto)

1. Hacer commit y push de los cambios.
2. En GitHub → **Actions**, esperar el ✅ del workflow. La primera vez tarda
   más, porque no hay caché.
3. GitHub crea las imágenes **privadas**, aunque el repo sea público:
   - **Repo público:** en GitHub → perfil → **Packages** → cada imagen →
     *Package settings* → *Change visibility* → **Public**.
   - **Repo privado:** dejarlas privadas. En el VPS, iniciar sesión una vez
     con un token que tenga solo `read:packages`:

     ```bash
     echo <token> | docker login ghcr.io -u <usuario> --password-stdin
     ```

4. En el VPS, la primera vez: **`git pull` primero** y después
   `bash deploy.sh`. El deploy.sh viejo construiría todo en el VPS.

## Uso diario

1. `git push`.
2. En el VPS: `bash deploy.sh`. Si Actions sigue construyendo, espera solo.

Para volver a una versión anterior:

```bash
TAG=<sha del commit> docker compose up -d
```

# Pendientes

Tareas detectadas el 2026-10-08 que quedaron para después. Seguir el orden:
la 2 depende de la 1.

---

## 1. ~~Reparar el MySQL local (XAMPP / MariaDB 10.4)~~ — resuelto (2026-10-08)

El directorio de datos de MySQL se reemplazó el 2026-10-08 a las 20:03 (el
log reinicia desde cero y `mysql.innodb_index_stats` ya se lee bien). Efecto
colateral: se perdieron las tablas de `bd_novaged`, sin respaldo. El
2026-10-11 se reconstruyó con migraciones + `seed:admin` +
`datos-iniciales.sql` (ver punto 2). Los pacientes, citas y movimientos de
prueba anteriores no se pudieron recuperar.

Quedó además una base `novaged` (esquema vacío + 3 roles, creada el
2026-10-10 a las 19:02) que la aplicación no usa: se puede borrar.

Lo que sigue documenta el problema original y su reparación, por si vuelve a
aparecer.

### Síntoma

MySQL se cae solo, sobre todo al crear o modificar tablas (cargar un esquema,
correr migraciones o tests). Desde el 2026-10-01 el log registra unas 15
recuperaciones tras caída. El error 500 que apareció una vez al iniciar sesión
en el panel fue una de estas caídas.

### Causa

En `C:\xampp\mysql\data\mysql_error.log`:

```
[ERROR] InnoDB: Database page corruption on disk or a failed file read of
tablespace mysql/innodb_index_stats page [page id: space=2, page number=0].
```

La tabla dañada es `mysql.innodb_index_stats`, una tabla interna de
estadísticas de índices. Los datos de la clínica (`bd_novaged`) no están
afectados. Cada vez que se crea o modifica una tabla, MariaDB intenta escribir
estadísticas en esa tabla dañada y se cae.

### Reparación

1. Encender MySQL desde el panel de XAMPP.
2. **Respaldar primero** la base de desarrollo:

   ```bash
   C:/xampp/mysql/bin/mysqldump.exe -u root --routines --triggers bd_novaged > respaldo-bd_novaged.sql
   ```

3. Volver a crear las dos tablas de estadísticas, que no contienen datos
   propios: MariaDB las recalcula sola.

   ```sql
   USE mysql;
   DROP TABLE IF EXISTS innodb_index_stats;
   DROP TABLE IF EXISTS innodb_table_stats;
   ```

   Después, ejecutar los `CREATE TABLE` de esas dos tablas tal como figuran
   en `C:\xampp\mysql\share\mysql_system_tables.sql` (variables
   `@create_innodb_table_stats` y `@create_innodb_index_stats`, líneas
   ~173–195). Conviene copiarlos de ese archivo y no reescribirlos a mano,
   para que coincidan con la versión instalada.

   Si `DROP TABLE` falla porque el archivo `.ibd` quedó huérfano, borrar a
   mano `innodb_index_stats.ibd` e `innodb_table_stats.ibd` de
   `C:\xampp\mysql\data\mysql\` con MySQL **apagado**, encenderlo y repetir
   los `CREATE TABLE`.

4. Reiniciar MySQL y comprobar que crear tablas ya no lo tira:

   ```bash
   C:/xampp/mysql/bin/mysql.exe -u root -e "CREATE DATABASE tmp_check; CREATE TABLE tmp_check.t (id INT PRIMARY KEY) ENGINE=InnoDB; DROP DATABASE tmp_check;"
   ```

5. Si queda alguna base temporal de una prueba interrumpida, borrarla:
   `DROP DATABASE IF EXISTS tmp_datos_a;`

Alternativa: restaurar `C:\xampp\mysql\data\mysql\` desde
`C:\xampp\mysql\backup\mysql\`. Solo conviene si esa copia es reciente,
porque reemplaza todas las tablas del sistema (usuarios, permisos, etc.).

---

## 2. ~~Probar `backend/sql/datos-iniciales.sql`~~ — resuelto el 2026-10-11

Se cargó en `bd_novaged`, recién creada por migraciones, sin errores y con
todos los conteos esperados (54 servicios, 54 asignaciones a la doctora,
6 horarios, 10 categorías, 11 marcas, 44 productos, ninguno sin categoría,
68 vínculos servicio–producto y 22 activos). También se probó de punta a
punta: login del admin, listados del panel, catálogo público con acentos
correctos y disponibilidad de la doctora (11 horarios un lunes). Como
`produccion.sql` y las migraciones producen el mismo esquema (punto 3),
también sirve para una base creada con `produccion.sql`.

### Qué contiene

Los datos reales del cliente, para cargar en una **base nueva** después de
crear el esquema:

| Contenido | Cantidad | Origen |
|---|---|---|
| Servicios | 54 | Página pública (sección Tratamientos) |
| Profesional | 1: Dra. Maria Noemi Ponce Caisiri, asignada a todos los servicios | Página pública (Dirección Médica) |
| Horario | Lun–Vie 09:00–20:00, Sáb 09:00–16:00 | Página pública (Contacto) |
| Categorías / marcas de producto | 10 / 11 | Deducidas |
| Productos | 44, con 68 vínculos a los servicios que los usan | Deducidos de los tratamientos |
| Activos de la clínica | 22 | Deducidos de los tratamientos |

**Valores estimados que el cliente debe revisar** (se corrigen desde el panel):

- Precios y duraciones de los servicios: la web no los publica.
- Stock, costo y precio de venta de los productos.
- Valor de adquisición de los activos. Marca, modelo, número de serie y fecha
  de compra quedan vacíos a propósito.
- Horario: el sistema admite un solo bloque por día
  (`HorarioDisponible.findOne` en `backend/src/services/disponibilidad.js`),
  así que el descanso de 13:00–14:00 de la web no se refleja.

### Cómo probarlo (después de reparar MySQL)

`produccion.sql` crea la base `novaged`. Para no pisar nada, cargarlo con
otro nombre:

```bash
M=C:/xampp/mysql/bin/mysql.exe
sed 's/`novaged`/`tmp_datos_a`/g' backend/sql/produccion.sql > /tmp/prod_a.sql
$M -u root < /tmp/prod_a.sql
$M -u root tmp_datos_a < backend/sql/datos-iniciales.sql
$M -u root tmp_datos_a -e "SELECT COUNT(*) FROM servicios; SELECT COUNT(*) FROM productos;
  SELECT COUNT(*) FROM productos WHERE categoria_id IS NULL;
  SELECT COUNT(*) FROM servicio_producto; SELECT COUNT(*) FROM activos_clinica;"
# Esperado: 54, 44, 0, 68, 22
$M -u root -e "DROP DATABASE tmp_datos_a;"
```

Repetir con una base creada por migraciones, que es la fuente de verdad del
esquema: `DB_NAME=tmp_datos_b npx sequelize-cli db:migrate` desde `backend/`.
Luego cargar el archivo, revisar los mismos conteos y borrar la base.

El archivo corre dentro de una transacción: si falla, no deja nada a medias.

---

## 3. ~~`backend/sql/produccion.sql` está desactualizado~~ — resuelto el 2026-10-10

Se actualizó hasta la migración `20261006000000-add-paquetes-sesiones`
(lote/vencimiento movidos a `compra_items`, geolocalización de asistencia y
`paquetes_sesiones`). Se verificó cargándolo en una base nueva y comparándolo
con una base creada por migraciones: mismas tablas, columnas (tipo, nulos y
valores por defecto), claves foráneas e índices. La única diferencia buscada
es el `UNSIGNED` de las claves.

Nota: `*.sql` está en `.gitignore`, así que este archivo no queda versionado.

---

## 4. Suite de tests del backend falla al correr completa

`npm test` en `backend/` falla en masa (65 de 96 tests, sin contar
`reportes.test.js`). Cada archivo pasa por separado. El primer error es
`sync({ force: true })` al crear `venta_items`: *"Foreign key constraint is
incorrectly formed"*. Eso deja la base de pruebas sin tablas y los archivos
siguientes fallan en cadena.

Puede estar relacionado con la corrupción del punto 1. Volver a correr la
suite después de repararlo, antes de investigar más.

**Actualización 2026-10-11** (con MySQL ya sano y `novaged_test` recreada):
la suite completa sigue fallando (80 de 101), así que no era la corrupción.
Corriendo cada archivo por separado pasan `inventario`, `reportes` y
`catalogo`. En `staff.test.js` fallan 3 tests también por separado, y fallaban
igual antes de los cambios de Inventario:

- *saldos pendientes y tratamientos › busca notas clínicas por nombre de paciente en el listado general*
- *control de personal › marca su entrada, luego su salida, y rechaza una tercera marca*
- *control de personal › el admin con permiso personal ve la asistencia de todos*

Los dos de asistencia probablemente vienen de la migración de geolocalización
(`20261005000000`), que exige ubicación al marcar.


---

## 5. Plantilla de WhatsApp `aviso_cita`

Pendiente del cliente: registrar y aprobar la plantilla en Meta.

- **Texto a registrar en Meta**, categoría Utilidad e idioma español:
  `Hola {{1}}, te escribimos de Clinic NovagED sobre tu cita del {{2}}: {{3}}`.
- **Después de aprobarla:** agregar `WHATSAPP_AVISO_TEMPLATE=aviso_cita` al
  `backend/.env` del VPS y reiniciar `api`.
- **Mientras no esté aprobada:** la anulación por comprobante inválido no
  avisa al paciente, y el panel lo indica.
- **Zona horaria:** los plazos usan la hora del servidor (igual que la
  agenda). Si el contenedor corre en UTC, conviene definir
  `TZ=America/La_Paz` en el servicio `api`. Esto se revisa aparte.

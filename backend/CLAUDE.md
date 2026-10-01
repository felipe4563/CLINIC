# Migraciones y `sql/produccion.sql`

Cada vez que se crea una migración nueva en `src/migrations/`, hay que reflejar
ese mismo cambio en `sql/produccion.sql` en el mismo turno/commit — no es
opcional, es parte de terminar la migración. `produccion.sql` es un snapshot
legible del esquema completo (todas las tablas y columnas ya fusionadas en su
forma final), no un historial de migraciones, así que el cambio se aplica
editando la tabla/columna correspondiente in place (agregando la columna al
`CREATE TABLE` que ya existe, o agregando un `CREATE TABLE` nuevo en el lugar
que le corresponde por dependencias de FK), no agregando un `ALTER TABLE` al
final del archivo.

Reglas de consistencia del archivo (para que siga siendo cargable de una sola
pasada en una base nueva):

- Todas las claves primarias y foráneas usan `INT UNSIGNED`, sin excepción —
  incluidas las tablas agregadas después de la migración base. Esto es
  intencional y es distinto del tipo real que quedó en la base de producción
  existente (ver la nota al inicio del archivo); `produccion.sql` prioriza ser
  un script autoconsistente para crear una base nueva desde cero.
- Después de editar el archivo, hay que probarlo cargándolo en una base local
  de prueba antes de darlo por terminado:

  ```bash
  mysql -u root -e "DROP DATABASE IF EXISTS novaged;"
  mysql -u root < backend/sql/produccion.sql
  mysql -u root novaged -e "SHOW TABLES;"
  mysql -u root -e "DROP DATABASE novaged;"   # limpiar al terminar
  ```

  Si algo falla (típicamente un mismatch de `UNSIGNED` en una FK), corregirlo
  ahí mismo, no dejarlo para después.
- Si la migración agrega datos semilla o cambia los permisos por defecto de
  los roles (`src/config/permisos.js`), actualizar también el `INSERT INTO
  roles` al final del archivo para que coincida.

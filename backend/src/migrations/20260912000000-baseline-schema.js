'use strict';

// Migracion base: crea todo el esquema tal como estaba siendo generado por
// sequelize.sync() hasta ahora (ver backend/sql/produccion.sql, del cual
// sale este DDL). A partir de esta migracion, todo cambio de esquema debe
// ser una migracion nueva -- ya no se usa sync() contra bases de datos con
// datos reales (dev/produccion). Los tests siguen usando
// sequelize.sync({force:true}) porque ahi no importa perder datos.
//
// Bases de datos que YA tenian este esquema creado por sync() (la dev local
// y la de produccion en el VPS) no deben correr este up() -- hay que
// "bautizarlas" como si ya estuviera aplicada. Ver
// backend/src/scripts/baselineMigrations.js.

const TABLAS = [
  `CREATE TABLE \`roles\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`nombre\` VARCHAR(50) NOT NULL,
    \`permisos\` JSON NOT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`roles_nombre_unique\` (\`nombre\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`usuarios\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`nombre\` VARCHAR(255) NOT NULL,
    \`email\` VARCHAR(255) NOT NULL,
    \`password_hash\` VARCHAR(255) NOT NULL,
    \`activo\` TINYINT(1) NOT NULL DEFAULT 1,
    \`rol_id\` INT UNSIGNED NOT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`usuarios_email_unique\` (\`email\`),
    KEY \`usuarios_rol_id_idx\` (\`rol_id\`),
    CONSTRAINT \`usuarios_rol_id_fk\` FOREIGN KEY (\`rol_id\`) REFERENCES \`roles\` (\`id\`)
      ON UPDATE CASCADE ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`pacientes\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`codigo_paciente\` VARCHAR(50) NOT NULL,
    \`nombre_completo\` VARCHAR(255) NOT NULL,
    \`telefono\` VARCHAR(30) NOT NULL,
    \`carnet_identidad\` VARCHAR(30) NOT NULL,
    \`carnet_complemento\` VARCHAR(10) DEFAULT NULL,
    \`carnet_expedido\` VARCHAR(10) NOT NULL,
    \`fecha_nacimiento\` DATE DEFAULT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`pacientes_codigo_paciente_unique\` (\`codigo_paciente\`),
    UNIQUE KEY \`pacientes_telefono_unique\` (\`telefono\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`otp_codes\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`telefono\` VARCHAR(30) NOT NULL,
    \`codigo\` VARCHAR(10) NOT NULL,
    \`expira_en\` DATETIME NOT NULL,
    \`usado\` TINYINT(1) NOT NULL DEFAULT 0,
    \`intentos\` INT NOT NULL DEFAULT 0,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    KEY \`otp_codes_telefono_idx\` (\`telefono\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`profesionales\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`nombre\` VARCHAR(255) NOT NULL,
    \`especialidad\` VARCHAR(255) DEFAULT NULL,
    \`foto_url\` VARCHAR(500) DEFAULT NULL,
    \`activo\` TINYINT(1) NOT NULL DEFAULT 1,
    \`usuario_id\` INT UNSIGNED DEFAULT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`profesionales_usuario_id_unique\` (\`usuario_id\`),
    CONSTRAINT \`profesionales_usuario_id_fk\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\` (\`id\`)
      ON UPDATE CASCADE ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`servicios\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`nombre\` VARCHAR(255) NOT NULL,
    \`descripcion\` TEXT DEFAULT NULL,
    \`duracion_min\` INT NOT NULL,
    \`precio\` DECIMAL(10,2) NOT NULL,
    \`activo\` TINYINT(1) NOT NULL DEFAULT 1,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`servicio_profesional\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`servicio_id\` INT UNSIGNED NOT NULL,
    \`profesional_id\` INT UNSIGNED NOT NULL,
    \`duracion_min_override\` INT DEFAULT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`servicio_profesional_unique\` (\`servicio_id\`, \`profesional_id\`),
    KEY \`servicio_profesional_profesional_id_idx\` (\`profesional_id\`),
    CONSTRAINT \`servicio_profesional_servicio_id_fk\` FOREIGN KEY (\`servicio_id\`) REFERENCES \`servicios\` (\`id\`)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT \`servicio_profesional_profesional_id_fk\` FOREIGN KEY (\`profesional_id\`) REFERENCES \`profesionales\` (\`id\`)
      ON UPDATE CASCADE ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`horarios_disponibles\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`dia_semana\` TINYINT NOT NULL COMMENT '0=domingo .. 6=sabado',
    \`hora_inicio\` TIME NOT NULL,
    \`hora_fin\` TIME NOT NULL,
    \`profesional_id\` INT UNSIGNED NOT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    KEY \`horarios_disponibles_profesional_id_idx\` (\`profesional_id\`),
    CONSTRAINT \`horarios_disponibles_profesional_id_fk\` FOREIGN KEY (\`profesional_id\`) REFERENCES \`profesionales\` (\`id\`)
      ON UPDATE CASCADE ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`citas\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`fecha\` DATE NOT NULL,
    \`hora_inicio\` TIME NOT NULL,
    \`hora_fin\` TIME NOT NULL,
    \`estado\` ENUM('pendiente_pago', 'confirmada', 'cancelada', 'completada', 'no_asistio') NOT NULL DEFAULT 'pendiente_pago',
    \`paciente_id\` INT UNSIGNED NOT NULL,
    \`profesional_id\` INT UNSIGNED NOT NULL,
    \`servicio_id\` INT UNSIGNED NOT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    KEY \`citas_paciente_id_idx\` (\`paciente_id\`),
    KEY \`citas_profesional_id_idx\` (\`profesional_id\`),
    KEY \`citas_servicio_id_idx\` (\`servicio_id\`),
    KEY \`citas_profesional_fecha_idx\` (\`profesional_id\`, \`fecha\`),
    CONSTRAINT \`citas_paciente_id_fk\` FOREIGN KEY (\`paciente_id\`) REFERENCES \`pacientes\` (\`id\`)
      ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT \`citas_profesional_id_fk\` FOREIGN KEY (\`profesional_id\`) REFERENCES \`profesionales\` (\`id\`)
      ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT \`citas_servicio_id_fk\` FOREIGN KEY (\`servicio_id\`) REFERENCES \`servicios\` (\`id\`)
      ON UPDATE CASCADE ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`pagos\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`monto\` DECIMAL(10,2) NOT NULL,
    \`monto_total\` DECIMAL(10,2) NOT NULL,
    \`porcentaje\` INT NOT NULL DEFAULT 100,
    \`estado\` ENUM('pendiente', 'pagado', 'fallido') NOT NULL DEFAULT 'pendiente',
    \`referencia_qr_banco\` VARCHAR(255) DEFAULT NULL,
    \`saldo_cobrado\` TINYINT(1) NOT NULL DEFAULT 0,
    \`metodo_pago_saldo\` ENUM('efectivo', 'qr') DEFAULT NULL,
    \`referencia_qr_saldo\` VARCHAR(255) DEFAULT NULL,
    \`cita_id\` INT UNSIGNED NOT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`pagos_cita_id_unique\` (\`cita_id\`),
    CONSTRAINT \`pagos_cita_id_fk\` FOREIGN KEY (\`cita_id\`) REFERENCES \`citas\` (\`id\`)
      ON UPDATE CASCADE ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`notas_clinicas\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`fecha\` DATE NOT NULL,
    \`hora\` TIME DEFAULT NULL,
    \`titulo\` VARCHAR(255) NOT NULL,
    \`notas\` TEXT NOT NULL,
    \`paciente_id\` INT UNSIGNED NOT NULL,
    \`profesional_id\` INT UNSIGNED DEFAULT NULL,
    \`cita_id\` INT UNSIGNED DEFAULT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    KEY \`notas_clinicas_paciente_id_idx\` (\`paciente_id\`),
    KEY \`notas_clinicas_profesional_id_idx\` (\`profesional_id\`),
    CONSTRAINT \`notas_clinicas_paciente_id_fk\` FOREIGN KEY (\`paciente_id\`) REFERENCES \`pacientes\` (\`id\`)
      ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT \`notas_clinicas_profesional_id_fk\` FOREIGN KEY (\`profesional_id\`) REFERENCES \`profesionales\` (\`id\`)
      ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT \`notas_clinicas_cita_id_fk\` FOREIGN KEY (\`cita_id\`) REFERENCES \`citas\` (\`id\`)
      ON UPDATE CASCADE ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`marcas\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`nombre\` VARCHAR(255) NOT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`marcas_nombre_unique\` (\`nombre\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`categorias_producto\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`nombre\` VARCHAR(255) NOT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`categorias_producto_nombre_unique\` (\`nombre\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`productos\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`nombre\` VARCHAR(255) NOT NULL,
    \`unidad\` VARCHAR(50) NOT NULL DEFAULT 'unidad',
    \`stock\` INT NOT NULL DEFAULT 0,
    \`stock_minimo\` INT NOT NULL DEFAULT 0,
    \`precio_venta\` DECIMAL(10,2) NOT NULL,
    \`precio_costo\` DECIMAL(10,2) DEFAULT NULL,
    \`lote\` VARCHAR(100) DEFAULT NULL,
    \`fecha_vencimiento\` DATE DEFAULT NULL,
    \`activo\` TINYINT(1) NOT NULL DEFAULT 1,
    \`marca_id\` INT UNSIGNED DEFAULT NULL,
    \`categoria_id\` INT UNSIGNED DEFAULT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    KEY \`productos_fecha_vencimiento_idx\` (\`fecha_vencimiento\`),
    CONSTRAINT \`productos_marca_id_fk\` FOREIGN KEY (\`marca_id\`) REFERENCES \`marcas\` (\`id\`)
      ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT \`productos_categoria_id_fk\` FOREIGN KEY (\`categoria_id\`) REFERENCES \`categorias_producto\` (\`id\`)
      ON UPDATE CASCADE ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`servicio_producto\` (
    \`servicio_id\` INT UNSIGNED NOT NULL,
    \`producto_id\` INT UNSIGNED NOT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    UNIQUE KEY \`servicio_producto_unique\` (\`servicio_id\`, \`producto_id\`),
    KEY \`servicio_producto_producto_id_idx\` (\`producto_id\`),
    CONSTRAINT \`servicio_producto_servicio_id_fk\` FOREIGN KEY (\`servicio_id\`) REFERENCES \`servicios\` (\`id\`)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT \`servicio_producto_producto_id_fk\` FOREIGN KEY (\`producto_id\`) REFERENCES \`productos\` (\`id\`)
      ON UPDATE CASCADE ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`activos_clinica\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`nombre\` VARCHAR(255) NOT NULL,
    \`categoria\` VARCHAR(255) DEFAULT NULL,
    \`marca\` VARCHAR(255) DEFAULT NULL,
    \`modelo\` VARCHAR(255) DEFAULT NULL,
    \`numero_serie\` VARCHAR(255) DEFAULT NULL,
    \`ubicacion\` VARCHAR(255) DEFAULT NULL,
    \`fecha_adquisicion\` DATE DEFAULT NULL,
    \`valor_adquisicion\` DECIMAL(10,2) DEFAULT NULL,
    \`estado\` ENUM('operativo', 'mantenimiento', 'dado_de_baja') NOT NULL DEFAULT 'operativo',
    \`fecha_baja\` DATE DEFAULT NULL,
    \`motivo_baja\` TEXT,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`ventas\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`fecha\` DATE NOT NULL,
    \`total\` DECIMAL(10,2) NOT NULL,
    \`metodo_pago\` ENUM('efectivo', 'qr') NOT NULL DEFAULT 'efectivo',
    \`estado\` ENUM('pendiente', 'pagado') NOT NULL DEFAULT 'pagado',
    \`referencia_qr\` VARCHAR(255) DEFAULT NULL,
    \`cliente_nombre\` VARCHAR(255) DEFAULT NULL,
    \`usuario_id\` INT UNSIGNED NOT NULL,
    \`paciente_id\` INT UNSIGNED DEFAULT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    KEY \`ventas_fecha_idx\` (\`fecha\`),
    CONSTRAINT \`ventas_usuario_id_fk\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\` (\`id\`)
      ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT \`ventas_paciente_id_fk\` FOREIGN KEY (\`paciente_id\`) REFERENCES \`pacientes\` (\`id\`)
      ON UPDATE CASCADE ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`venta_items\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`cantidad\` INT NOT NULL,
    \`precio_unitario\` DECIMAL(10,2) NOT NULL,
    \`subtotal\` DECIMAL(10,2) NOT NULL,
    \`venta_id\` INT UNSIGNED NOT NULL,
    \`producto_id\` INT UNSIGNED NOT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    KEY \`venta_items_venta_id_idx\` (\`venta_id\`),
    CONSTRAINT \`venta_items_venta_id_fk\` FOREIGN KEY (\`venta_id\`) REFERENCES \`ventas\` (\`id\`)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT \`venta_items_producto_id_fk\` FOREIGN KEY (\`producto_id\`) REFERENCES \`productos\` (\`id\`)
      ON UPDATE CASCADE ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`movimientos_caja\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`tipo\` ENUM('ingreso', 'egreso') NOT NULL,
    \`concepto\` VARCHAR(255) NOT NULL,
    \`monto\` DECIMAL(10,2) NOT NULL,
    \`fecha\` DATE NOT NULL,
    \`usuario_id\` INT UNSIGNED NOT NULL,
    \`pago_id\` INT UNSIGNED DEFAULT NULL,
    \`venta_id\` INT UNSIGNED DEFAULT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    KEY \`movimientos_caja_fecha_idx\` (\`fecha\`),
    KEY \`movimientos_caja_usuario_id_idx\` (\`usuario_id\`),
    CONSTRAINT \`movimientos_caja_usuario_id_fk\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\` (\`id\`)
      ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT \`movimientos_caja_pago_id_fk\` FOREIGN KEY (\`pago_id\`) REFERENCES \`pagos\` (\`id\`)
      ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT \`movimientos_caja_venta_id_fk\` FOREIGN KEY (\`venta_id\`) REFERENCES \`ventas\` (\`id\`)
      ON UPDATE CASCADE ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`automatizacion_config\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`recordatorio_24h\` TINYINT(1) NOT NULL DEFAULT 1,
    \`recordatorio_2h\` TINYINT(1) NOT NULL DEFAULT 1,
    \`no_show\` TINYINT(1) NOT NULL DEFAULT 1,
    \`post_consulta\` TINYINT(1) NOT NULL DEFAULT 1,
    \`saldo_pendiente\` TINYINT(1) NOT NULL DEFAULT 1,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`notificaciones_automaticas\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`tipo\` ENUM('recordatorio_24h', 'recordatorio_2h', 'no_show', 'post_consulta', 'saldo_pendiente') NOT NULL,
    \`enviado_at\` DATETIME NOT NULL,
    \`cita_id\` INT UNSIGNED DEFAULT NULL,
    \`pago_id\` INT UNSIGNED DEFAULT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    KEY \`notificaciones_automaticas_cita_id_idx\` (\`cita_id\`),
    KEY \`notificaciones_automaticas_pago_id_idx\` (\`pago_id\`),
    CONSTRAINT \`notificaciones_automaticas_cita_id_fk\` FOREIGN KEY (\`cita_id\`) REFERENCES \`citas\` (\`id\`)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT \`notificaciones_automaticas_pago_id_fk\` FOREIGN KEY (\`pago_id\`) REFERENCES \`pagos\` (\`id\`)
      ON UPDATE CASCADE ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`registros_asistencia\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`fecha\` DATE NOT NULL,
    \`hora_entrada\` TIME DEFAULT NULL,
    \`hora_salida\` TIME DEFAULT NULL,
    \`observacion\` VARCHAR(255) DEFAULT NULL,
    \`usuario_id\` INT UNSIGNED NOT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    KEY \`registros_asistencia_usuario_id_idx\` (\`usuario_id\`),
    KEY \`registros_asistencia_fecha_idx\` (\`fecha\`),
    CONSTRAINT \`registros_asistencia_usuario_id_fk\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\` (\`id\`)
      ON UPDATE CASCADE ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`ausencias\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`tipo\` ENUM('vacacion', 'licencia_medica', 'permiso', 'falta_justificada', 'falta_injustificada') NOT NULL,
    \`fecha_desde\` DATE NOT NULL,
    \`fecha_hasta\` DATE NOT NULL,
    \`motivo\` TEXT,
    \`estado\` ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
    \`usuario_id\` INT UNSIGNED NOT NULL,
    \`aprobado_por_id\` INT UNSIGNED DEFAULT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    KEY \`ausencias_usuario_id_idx\` (\`usuario_id\`),
    KEY \`ausencias_aprobado_por_id_idx\` (\`aprobado_por_id\`),
    CONSTRAINT \`ausencias_usuario_id_fk\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\` (\`id\`)
      ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT \`ausencias_aprobado_por_id_fk\` FOREIGN KEY (\`aprobado_por_id\`) REFERENCES \`usuarios\` (\`id\`)
      ON UPDATE CASCADE ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE \`configuracion_clinica\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`nombre_consultorio\` VARCHAR(255) NOT NULL DEFAULT 'Clinic NovagED',
    \`nit\` VARCHAR(255) DEFAULT NULL,
    \`direccion\` VARCHAR(255) DEFAULT NULL,
    \`ciudad\` VARCHAR(255) DEFAULT NULL,
    \`pais\` VARCHAR(255) DEFAULT 'Bolivia',
    \`telefono\` VARCHAR(255) DEFAULT NULL,
    \`email\` VARCHAR(255) DEFAULT NULL,
    \`sitio_web\` VARCHAR(255) DEFAULT NULL,
    \`logo_url\` VARCHAR(255) DEFAULT NULL,
    \`pie_pdf\` TEXT,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

// Orden inverso de creacion, para poder revertir sin violar FKs.
const TABLAS_EN_ORDEN = [
  'configuracion_clinica', 'ausencias', 'registros_asistencia', 'notificaciones_automaticas',
  'automatizacion_config', 'movimientos_caja', 'venta_items', 'ventas', 'activos_clinica',
  'servicio_producto', 'productos', 'categorias_producto', 'marcas', 'notas_clinicas', 'pagos',
  'citas', 'horarios_disponibles', 'servicio_profesional', 'servicios', 'profesionales',
  'otp_codes', 'pacientes', 'usuarios', 'roles',
];

module.exports = {
  async up(queryInterface) {
    for (const ddl of TABLAS) {
      await queryInterface.sequelize.query(ddl);
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const tabla of TABLAS_EN_ORDEN) {
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS \`${tabla}\``);
    }
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  },
};

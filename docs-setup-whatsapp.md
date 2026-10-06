# Configurar WhatsApp Business API (mensajes automáticos)

Los mensajes automáticos de Automatización (recordatorios de cita, aviso de
inasistencia, mensaje post-consulta, saldo pendiente) ya están implementados
en el backend y corren solos cada 15 minutos (`backend/src/server.js`, cron
`node-cron`). Lo que falta es conectar con una cuenta real de WhatsApp
Business — hoy el `.env` tiene credenciales falsas (`dev_fake_token`), por
eso los envíos fallan con error 401.

## 1. Crear la cuenta de Meta Business

1. Entrar a [business.facebook.com](https://business.facebook.com) y
   crear/usar una cuenta de **Meta Business**.
2. En [developers.facebook.com](https://developers.facebook.com), crear una
   app tipo **Business**.
3. Dentro de la app, agregar el producto **WhatsApp**.

## 2. Vincular el número

1. Meta da un número de prueba gratis para testing, pero para producción
   real hay que agregar y **verificar el número propio** de la clínica — no
   puede ser un WhatsApp personal activo, debe migrarse a WhatsApp Business
   API.
2. Una vez verificado, en el panel de WhatsApp → API Setup aparecen:
   - **Phone Number ID** → va en `WHATSAPP_PHONE_NUMBER_ID`
   - **Token de acceso** temporal (24h, solo para probar) o uno
     **permanente**, generado desde System Users en Meta Business Settings
     → va en `WHATSAPP_TOKEN`

## 3. Crear y aprobar las 5 plantillas

En el panel de Meta (WhatsApp Manager → Message Templates), crear una
plantilla por cada tipo, en español, categoría "Utility", con estos
nombres exactos (deben coincidir con el `.env`):

| Nombre exacto | Texto sugerido | Parámetros que manda el código |
|---|---|---|
| `recordatorio_24h` | "Hola {{1}}, tu cita es el {{2}} a las {{3}}." | `[fecha, hora]` → ver nota abajo |
| `recordatorio_2h` | "Hola {{1}}, tu cita es el {{2}} a las {{3}}." | `[fecha, hora]` → ver nota abajo |
| `cita_no_asistio` | "Hola {{1}}, notamos que no pudiste asistir a tu cita. Contactanos para reagendar." | `[nombre paciente]` |
| `post_consulta` | "Hola {{1}}, gracias por tu visita a Clinic NovagED. ¡Esperamos verte pronto!" | `[nombre paciente]` |
| `saldo_pendiente` | "Hola {{1}}, tenés un saldo pendiente de Bs {{2}} por tu cita." | `[nombre paciente, monto]` |

**Nota sobre `recordatorio_24h` / `recordatorio_2h`:** el job
(`backend/src/jobs/recordatorios.js:52`) les manda `[cita.fecha,
cita.hora_inicio]` como parámetros, no el nombre del paciente. Las
plantillas deben usar `{{1}}` = fecha y `{{2}}` = hora (ajustar el texto de
ejemplo de la tabla si se agrega el nombre como variable extra, cambiando
también el código que arma `parametros`).

Meta tarda entre horas y un par de días en aprobar cada plantilla.

## 4. Completar el `.env` del backend

Reemplazar en `backend/.env`:

```
WHATSAPP_TOKEN=<token real>
WHATSAPP_PHONE_NUMBER_ID=<phone number id real>
```

Los nombres de plantilla (`WHATSAPP_RECORDATORIO_24H_TEMPLATE`, etc.) ya
están bien si se usan los mismos nombres de la tabla de arriba.

## 5. Costo

Meta cobra por conversación iniciada fuera de la ventana de 24h de
respuesta del cliente — hay que tener un método de pago cargado en Meta
Business Manager o se cortan los envíos.

## Resultado

Con las credenciales reales cargadas, el cron que ya corre cada 15 min en
el backend (`server.js:13`) empieza a enviar los mensajes de verdad — no
hace falta tocar código.

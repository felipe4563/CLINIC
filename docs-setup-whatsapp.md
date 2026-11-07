# Conectar WhatsApp (desde cero)

El sistema ya sabe mandar todos los mensajes por WhatsApp. Solo falta la cuenta
de WhatsApp Business de la clínica en Meta y poner dos datos en el servidor.
Mientras no estén, no se envía nada y en **Automatización** aparece
"WhatsApp no conectado".

Qué manda el sistema:

- **Cita confirmada** cuando se paga la reserva o se reprograma.
- **Aviso de cita** cuando el comprobante de pago no es válido.
- Los automáticos de **Automatización**: recordatorio 24 h y 2 h antes, aviso de
  inasistencia, mensaje post-consulta y saldo pendiente.

## Antes de empezar

- **Un número solo para WhatsApp de la clínica.** Puede ser un chip nuevo. No
  puede estar usándose en la app de WhatsApp de un celular: si ya lo está, hay
  que borrar esa cuenta de WhatsApp antes de registrarlo.
- **Una tarjeta** para cargar en Meta. Meta cobra cada conversación que inicia
  la clínica (centavos de dólar por mensaje en Bolivia).
- Los datos de la clínica (nombre legal, NIT, dirección, sitio web) para la
  verificación del negocio.

## 1. Cuenta de negocio en Meta

1. Entrar a [business.facebook.com](https://business.facebook.com) con una
   cuenta de Facebook de la clínica y crear el **portafolio comercial**
   "Clinic NovagED".
2. En **Configuración del negocio → Centro de seguridad**, iniciar la
   **verificación del negocio** con el NIT y un documento de la clínica. Sin
   verificar, Meta limita los mensajes a 250 por día.

## 2. App y número de WhatsApp

1. En [developers.facebook.com](https://developers.facebook.com) → **Mis apps →
   Crear app** → tipo **Empresa**, unida al portafolio de la clínica.
2. En la app, agregar el producto **WhatsApp**.
3. En **WhatsApp → Configuración de la API**, **Agregar número de teléfono**:
   nombre visible "Clinic NovagED", categoría Salud, y verificarlo con el código
   que llega por SMS o llamada.
4. Copiar el **Identificador del número de teléfono** (Phone number ID).
   Ese es `WHATSAPP_PHONE_NUMBER_ID`.

## 3. Token permanente

El token que aparece en "Configuración de la API" vence en 24 horas. Para el
servidor hace falta uno permanente:

1. **Configuración del negocio → Usuarios → Usuarios del sistema → Agregar**,
   rol Administrador.
2. **Asignar activos**: la app (control total) y la cuenta de WhatsApp.
3. **Generar token** → elegir la app → caducidad **Nunca** → permisos
   `whatsapp_business_messaging` y `whatsapp_business_management`.
4. Guardar el token en un lugar seguro: Meta no lo vuelve a mostrar. Ese es
   `WHATSAPP_TOKEN`.
5. En **WhatsApp → Configuración de la API → Método de pago**, cargar la tarjeta.

## 4. Plantillas de mensaje

Meta solo deja que la clínica escriba primero con plantillas aprobadas. Crear
cada una en **WhatsApp Manager → Plantillas de mensajes → Crear**, idioma
**Español**, con el **nombre exacto** de la tabla (minúsculas y guion bajo). En
"Ejemplo" de cada variable poner un valor como los de la columna de ejemplo:
Meta los pide para aprobar.

| Nombre | Categoría | Texto | Ejemplo de variables |
|---|---|---|---|
| `cita_confirmada` | Utilidad | Hola {{1}}, tu cita de {{2}} en Clinic NovagED quedó confirmada para el {{3}} a las {{4}}. Si necesitas cambiarla, responde a este mensaje. | Ana Rojas · Microneedling · lunes 9 de noviembre · 10:30 |
| `recordatorio_24h` | Utilidad | Hola {{1}}, te recordamos tu cita de {{2}} mañana, {{3}}, a las {{4}} en Clinic NovagED. ¡Te esperamos! | Ana Rojas · Microneedling · lunes 9 de noviembre · 10:30 |
| `recordatorio_2h` | Utilidad | Hola {{1}}, tu cita de {{2}} es hoy, {{3}}, a las {{4}}. Te esperamos en Clinic NovagED. | Ana Rojas · Microneedling · lunes 9 de noviembre · 10:30 |
| `cita_no_asistio` | Utilidad | Hola {{1}}, hoy te esperábamos en Clinic NovagED y no pudimos verte. Escríbenos para reprogramar tu cita. | Ana Rojas |
| `post_consulta` | Utilidad | Hola {{1}}, gracias por visitarnos en Clinic NovagED. Si tienes alguna duda sobre tu tratamiento, escríbenos por aquí. | Ana Rojas |
| `saldo_pendiente` | Utilidad | Hola {{1}}, te recordamos que tienes un saldo pendiente de Bs {{2}} de tu cita en Clinic NovagED. Puedes pagarlo en tu próxima visita. | Ana Rojas · 250.00 |
| `aviso_cita` | Utilidad | Hola {{1}}, te escribimos de Clinic NovagED sobre tu cita del {{2}}: {{3}} | Ana Rojas · lunes 9 de noviembre a las 10:30 · el comprobante de pago no es válido |

- El orden de las variables tiene que ser exactamente ese: el sistema las
  manda en ese orden.
- Si Meta cambia la categoría de Utilidad a Marketing, rechazarla y escribir el
  texto sin promociones ni emojis de oferta.
- La aprobación tarda de minutos a un par de días. Cada plantilla se puede ver
  "Activa" en WhatsApp Manager.

## 5. Poner los datos en el servidor

En el `.env` del backend del servidor (no en la copia local):

```
WHATSAPP_TOKEN=<token permanente del paso 3>
WHATSAPP_PHONE_NUMBER_ID=<identificador del paso 2>
WHATSAPP_IDIOMA=es
WHATSAPP_CITA_CONFIRMADA_TEMPLATE=cita_confirmada
WHATSAPP_AVISO_TEMPLATE=aviso_cita
WHATSAPP_RECORDATORIO_24H_TEMPLATE=recordatorio_24h
WHATSAPP_RECORDATORIO_2H_TEMPLATE=recordatorio_2h
WHATSAPP_NO_SHOW_TEMPLATE=cita_no_asistio
WHATSAPP_POST_CONSULTA_TEMPLATE=post_consulta
WHATSAPP_SALDO_PENDIENTE_TEMPLATE=saldo_pendiente
```

Reiniciar la API. Si alguna plantilla se aprobó en "Español (México)" u otra
variante, cambiar `WHATSAPP_IDIOMA` (por ejemplo `es_MX`).

## 6. Probar

1. En el panel, **Automatización** debe decir **WhatsApp conectado**.
2. **Enviar mensaje de prueba** a tu celular: llega "Hello World", la plantilla
   que Meta trae aprobada en toda cuenta nueva. Si llega, el número y el token
   están bien.
3. Hacer una reserva de prueba en la web con tu número y confirmarla: tiene que
   llegar la confirmación de la cita.
4. Si algo falla, en **Automatización → Últimos mensajes** aparece en rojo con
   el motivo que dio WhatsApp (plantilla no aprobada, número inválido, etc.).
   Los recordatorios que fallan se vuelven a intentar cada 15 minutos.

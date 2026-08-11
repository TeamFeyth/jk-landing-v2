# Entrega de leads, captcha y pixel

Documento único para las dos landings. El código es el mismo salvo la tabla de
vehículos y el identificador de landing.

---

## 1. Cómo llega el lead a Neo CRM

Noor confirmó que Neo importa por correo con ADF XML. Una página estática no puede
mandar correo, así que hay una función corriendo en el mismo dominio:

```
formulario  →  POST /api/lead  (Cloudflare Pages Function)
                 ├─ valida otra vez, del lado servidor
                 ├─ verifica el captcha con la secret key
                 ├─ arma el ADF XML
                 ├─ lo manda por correo a jkamalcars@ledas.neoverify.com
                 └─ copia el lead a LEAD_FORWARD_URL si está configurada
```

Vive en `functions/api/lead.js`. Cloudflare Pages detecta sola la carpeta
`functions/`: no hay que instalar adaptador, ni cambiar el build, ni tocar
`astro.config.mjs`. El sitio sigue siendo estático.

Que esté en el mismo dominio resuelve dos cosas de una: no hay CORS que pelear, y
las llaves secretas viven del lado servidor, que es donde tienen que estar.

**El formulario ya no miente.** Solo muestra el mensaje de éxito, o avanza a
`/thank-you` en la LP1, si la función respondió que el lead salió. Si no salió,
sale el error con el teléfono.

---

## 2. Lo único que falta para que los leads lleguen de verdad

Una llave de correo. Cualquiera de las dos sirve; hay que poner una:

**Opción A — Resend** (recomendada, plan gratuito de 3.000 correos al mes)

1. Crear cuenta en resend.com y verificar el dominio `jkamalcars.com`.
2. Generar una API key.
3. En Cloudflare Pages → Settings → Environment variables:
   - `RESEND_API_KEY` = la llave, marcada **Encrypt**
   - `MAIL_FROM` = `John Kamal Cars <leads@jkamalcars.com>`

**Opción B — Mailgun**

- `MAILGUN_API_KEY` (Encrypt) y `MAILGUN_DOMAIN`.

**Opción C — sin proveedor de correo**

Poner `LEAD_FORWARD_URL` apuntando a un webhook de Make, Zapier, n8n o Apps
Script. La función le manda el lead en JSON **con el ADF ya armado** en el campo
`adf_xml`, así que del otro lado solo hay que adjuntarlo a un correo.

Las tres se pueden combinar. Basta con que una entregue para que el lead cuente
como enviado.

**Mientras no haya ninguna configurada**, la función responde 503 y el visitante
ve el error con el teléfono. Es a propósito: prefiero que llame a que crea que
dejó sus datos y nadie lo contacte.

---

## 3. Captcha

Quedó **Cloudflare Turnstile** como opción por defecto, no reCAPTCHA. La razón es
justo el problema con el que te topaste: en reCAPTCHA la secret key sale de la
consola de administración de Google, hay que registrar el sitio y crear una cuenta
aparte. Turnstile sale del mismo panel de Cloudflare donde ya vive el sitio, es
gratis sin tope, y no le muestra rompecabezas a nadie.

**Funciona desde ahora mismo.** Está puesto con el par de llaves públicas de prueba
de Cloudflare, que siempre aprueban:

| | Valor |
|---|---|
| Site key (navegador) | `1x00000000000000000000AA` |
| Secret key (función) | `1x0000000000000000000000000000000AA` |

Con eso la cadena completa ya corre y se puede probar el envío. Para pasar a
producción:

1. Cloudflare → Turnstile → Add site → dominio de la landing, widget tipo *Managed*.
2. `PUBLIC_TURNSTILE_SITE_KEY` = la site key.
3. `TURNSTILE_SECRET_KEY` = la secret key, marcada **Encrypt**.
4. Redeploy.

El widget está en modo `interaction-only`: no se ve nada salvo que Cloudflare
sospeche del visitante, y ahí sí aparece la casilla. No estorba la conversión.

**reCAPTCHA sigue soportado.** Si en algún momento consiguen las llaves de Google:

- `PUBLIC_CAPTCHA_PROVIDER=recaptcha`
- `PUBLIC_RECAPTCHA_SITE_KEY` y `RECAPTCHA_SECRET_KEY`
- `CAPTCHA_MIN_SCORE` para el umbral, 0.5 por defecto

La función verifica el score y descarta lo que quede por debajo.

---

## 4. Pixel de Meta

El pixel de prueba `1042412788159075` quedó como valor por defecto en el código, así
que ya está midiendo sin tener que configurar nada. Para cambiarlo al definitivo se
pone `PUBLIC_META_PIXEL_ID` en Cloudflare y se redeploya. **No hay que editar
archivos.**

Sigue esperando al consentimiento de cookies: con `PUBLIC_REQUIRE_COOKIE_CONSENT`
en `true` el pixel no se inyecta hasta que la persona acepta, y si acepta después
carga en ese momento sin recargar.

`PageView` en la carga y un solo `Lead` por envío, con `event_id`. Ese identificador
es el mismo que la función escribe en el ADF, así que cuando el CRM devuelva la
venta se puede deduplicar contra el evento del pixel.

---

## 5. Variables en Cloudflare Pages

Van en **Settings → Environment variables**, y ojo: Production y Preview son listas
separadas, Preview no hereda nada. Cada cambio exige redeploy manual.

### Públicas (las ve el navegador)

| Variable | Si se deja vacía |
|---|---|
| `PUBLIC_META_PIXEL_ID` | usa el pixel de prueba `1042412788159075` |
| `PUBLIC_CAPTCHA_PROVIDER` | `turnstile` |
| `PUBLIC_TURNSTILE_SITE_KEY` | usa la llave de prueba que siempre aprueba |
| `PUBLIC_RECAPTCHA_SITE_KEY` | sin reCAPTCHA |
| `PUBLIC_REQUIRE_COOKIE_CONSENT` | `true` |
| `PUBLIC_LEAD_ENDPOINT` | `/api/lead` |

### Privadas (solo las lee la función — marcar Encrypt las que tengan secreto)

| Variable | Si se deja vacía |
|---|---|
| `CRM_EMAIL` | `jkamalcars@ledas.neoverify.com` |
| `MAIL_FROM` | `John Kamal Cars <leads@jkamalcars.com>` |
| `MAIL_REPLY_TO` | responde al correo del cliente |
| `RESEND_API_KEY` | no manda por Resend |
| `MAILGUN_API_KEY` / `MAILGUN_DOMAIN` | no manda por Mailgun |
| `LEAD_FORWARD_URL` | sin copia al webhook |
| `TURNSTILE_SECRET_KEY` | usa la de prueba que siempre aprueba |
| `RECAPTCHA_SECRET_KEY` | no verifica reCAPTCHA |
| `CAPTCHA_MIN_SCORE` | `0.5` |

---

## 6. Cómo probar

**En local**, la función necesita Wrangler porque Astro solo sirve archivos:

```bash
npm run build
npx wrangler pages dev dist
```

**En producción**, con curl:

```bash
curl -X POST https://TU-DOMINIO/api/lead \
  -H 'Content-Type: application/json' \
  -d '{"landing":"lp2","source":"hero","name":"Prueba Feyth",
       "phone":"8325550142","email":"prueba@feyth.com",
       "open_loan":"no","employed":"yes",
       "captcha_token":"XXXX.DUMMY.XXXX"}'
```

Respuestas posibles:

| Código | Qué significa |
|---|---|
| `200 {"ok":true}` | el lead salió |
| `422` | falló la validación del servidor, dice qué campos |
| `403` | el captcha rechazó |
| `503` | no hay canal de entrega configurado |

Los `console.log` y `console.error` de la función salen en Cloudflare Pages →
Deployment → Functions → Real-time logs. Si no hay proveedor de correo, ahí queda
impreso el ADF completo, que sirve para verificar el formato antes de tener llaves.

---

## 7. Qué mandarle a Noor

Un lead de prueba real, disparado desde el formulario con el proveedor de correo ya
puesto. Y junto con el XML, tres preguntas:

1. **¿El formato le sirve tal cual?** Que lo pase por su parser antes de que
   demos por cerrada la integración.
2. **La atribución va dentro de `<comments>`.** ADF no tiene campo propio para
   `event_id`, `fbc`, `fbp` ni UTMs, así que van como texto etiquetado. Si su
   parser acepta nodos personalizados es mejor: quedan en columnas y no en un
   bloque de texto.
3. **`event_id` es el crítico.** Es lo que después une la venta del CRM con el
   evento del pixel. Si Neo lo trunca o lo descarta, hay que buscarle otro campo.

Y una cosa más, que conviene dejar por escrito con Fayth: **el correo no confirma
entrega**. Si el buzón rebota, se llena o marca spam, el lead se pierde en silencio
y nadie llama. Por eso vale la pena poner también `LEAD_FORWARD_URL` hacia un Google
Sheet: es la copia con la que uno se entera de que algo dejó de llegar.

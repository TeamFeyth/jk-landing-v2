# Landing Page 2 — John Kamal Cars

Construida solo desde `Landing Page 2.1.md` y `guideline for john kamal cars.MD`.
No hay nada heredado de la primera landing salvo los dos enlaces legales.

`astro check`: 0 errores, 0 warnings, 0 hints. `npm run build`: limpio.
Una página, ~4 KB de JS, fuentes Archivo y Archivo Black auto-hospedadas.

---

## 1. Estructura

```
jk-landing-v2/
├── astro.config.mjs · package.json · tsconfig.json · .env.example
├── public/
│   ├── favicon.svg
│   └── images/brand/          ← aquí van hero_image_mobile y hero_image_desktop
└── src/
    ├── data/
    │   ├── copy.ts            todo el texto, literal del documento
    │   ├── site.ts            teléfono, dirección, horario, enlaces, hero
    │   └── vehicles.ts        los 3 vehículos
    ├── styles/
    │   ├── tokens.css         color, tipografía, espaciado, botones
    │   ├── base.css           reset, escala tipográfica, contenedores
    │   └── components.css     todos los bloques
    ├── lib/
    │   ├── env.ts             variables PUBLIC_
    │   ├── tracking.ts        fbc/fbp, fbclid, UTMs, event_id
    │   ├── validation.ts      teléfono, correo, nombre, selects
    │   └── leads.ts           payload, webhook, variante Apps Script
    ├── components/
    │   ├── Header.astro       §1
    │   ├── Logo.astro         lockup JK + wordmark
    │   ├── Hero.astro         §2
    │   ├── TrustStrip.astro   §3
    │   ├── FeaturedVehicles.astro + VehicleCard.astro   §4
    │   ├── HowItWorks.astro   §5
    │   ├── ReviewsStrip.astro §6
    │   ├── BottomBlock.astro  §7
    │   ├── LeadForm.astro     §8 — las tres instancias
    │   ├── Footer.astro       §9
    │   ├── FloatingCall.astro §10
    │   ├── MobilePopup.astro  §11
    │   ├── MetaPixel.astro
    │   └── Icon.astro
    ├── layouts/Base.astro
    └── pages/index.astro · robots.txt.ts
```

Para cambiar contenido no se toca ningún componente: texto en `copy.ts`,
negocio en `site.ts`, autos en `vehicles.ts`, marca en `tokens.css`.

---

## 2. Los tres vehículos

Datos tomados de las páginas del cliente, no del documento.

| # | Documento decía | Página del cliente | Se usó |
|---|---|---|---|
| 1 | 2019 Honda Accord LX · 98,340 mi · $2,000 | 2017 Honda Accord LX CVT · 84,325 mi · FWD · $2,800 | la página |
| 2 | 2020 Nissan Rogue SV · 76,120 mi · AWD · $2,500 | 2018 Nissan Rogue FWD SL · 88,486 mi · FWD · $2,200 | la página |
| 3 | 2018 Ford F-150 XLT | 2022 Ford Expedition Platinum · 53,560 mi · 4x2 | reemplazado |

Los números de stock también son los reales: `212255`, `843051`, `A62810`.

**La Expedition no tiene enganche publicado.** Su página dice "Call for details" y
eso es lo que muestra la tarjeta. Si hay una cifra, se cambia en una línea.

**Faltan plazo, tasa y pago quincenal.** El documento pedía esas tres filas en la
tarjeta y traía valores de muestra (42 mo, 18%, $215) que corresponden a los autos
inventados, no a estos. Las páginas del cliente no publican financiamiento. Los
campos están en `null` y la tarjeta esconde sola esas filas: quedan visibles el
enganche y las dos acciones. **No los invento** porque son números que después
alguien cobra. Con esos datos se llenan en dos minutos.

Las fotos son las de los tres enlaces, servidas desde el CDN del cliente. Funcionan
ya. Si Autodealers.Digital activa protección de hotlinking se caen, así que
conviene bajarlas a `public/images/vehicles/` antes de encender pauta.

---

## 3. Imágenes del hero

El hero apunta a `/images/brand/hero_image_mobile.webp` y
`/images/brand/hero_image_desktop.webp`. La móvil es la de por defecto y la de
escritorio entra a partir de 768px, así que en celular nunca se descarga la grande.
Encima va el velo negro al 55% que pide la guía para texto sobre foto.

Asumí extensión `.webp`. Si es `.jpg` o `.png`, se cambia en `heroImages` dentro de
`site.ts` — dos líneas.

---

## 4. Conexiones

**Neo CRM.** `POST` con JSON a `PUBLIC_WEBHOOK_URL`. El cuerpo lleva:

```
landing, source, stock, event_id,
name, phone, email, open_loan, employed,
page_url, landing_url, referrer, submitted_at,
fbc, fbp, fbclid, utm_source, utm_medium, utm_campaign, utm_content, utm_term
```

`landing` viene fijo en `lp2` y `source` distingue `hero` / `bottom` / `popup`, que
es lo que pide el documento: mismo destino, etiquetado por instancia. `stock` solo
llega si el visitante entró por "Finance Me" de una tarjeta.

Sin `PUBLIC_WEBHOOK_URL` el formulario **no finge que funciona**: muestra el error y
deja el teléfono como salida.

**Apps Script.** Al final de `src/lib/leads.ts` hay un bloque comentado con la
versión alterna y el `doPost` de Google. Apps Script no responde el preflight
`OPTIONS` que dispara el encabezado `application/json`, así que hay que mandar
`text/plain` y parsear dentro del script. Solo se activa si se confirma ese destino.
Con Zapier, Make o n8n no hace falta tocar nada.

**Meta.** El Pixel no se inyecta si `PUBLIC_META_PIXEL_ID` está vacía. `PageView` al
cargar y un `Lead` al enviar el formulario, con `event_id`. Ese `event_id` es la
clave de deduplicación: la CAPI tiene que reenviar el mismo valor. `fbclid` y UTMs
se guardan al llegar y sobreviven a la navegación interna; `fbc` y `fbp` se leen de
las cookies del Pixel.

| Variable | Valor | Estado |
|---|---|---|
| `PUBLIC_SITE_URL` | `https://jk-landing-v2.pages.dev` | Obligatoria |
| `PUBLIC_ALLOW_INDEXING` | `false` | A `true` el día del lanzamiento |
| `PUBLIC_WEBHOOK_URL` | vacía | Falta |
| `PUBLIC_META_PIXEL_ID` | vacía | Falta |

---

## 5. Decisiones de marca

**El rojo, una vez por pantalla.** La guía es explícita: dos primarios en una vista
es un error. El documento pide botón "Get Approved" en el header y botón de envío en
el formulario del hero, y los dos se ven al mismo tiempo. Resolví dejando los dos
botones del header en secundario (contorno Ink) y el botón flotante de llamada en
Ink Black. El único rojo en cada pantalla es el botón de envío del formulario.
Si prefieres el header en rojo, es una clase.

**Las dos preguntas del formulario llevan etiqueta encima del campo,** no dentro.
"Open auto loan on another vehicle?" no cabe flotando dentro de un campo en celular.
Los tres campos de texto sí siguen la regla de la guía: etiqueta dentro hasta el
foco. Asteriscos requeridos en rojo, letra chica a 12px.

**Todo en inglés.** El documento de copy trae los textos solo en inglés y no inventé
traducciones. La guía de marca sí pide bilingüe por defecto: si quieres los pares
español, mándame el texto aprobado y los agrego en itálica debajo de cada bloque,
que es como manda el lockup.

---

## 6. Lo que quedó fuera por no estar en el documento

Ninguno de estos está en la guía de la landing 2, así que no los puse. Cada uno se
agrega rápido si lo pides:

- **reCAPTCHA.** El formulario tiene campo trampa y validación, pero sin reCAPTCHA
  entra spam al CRM, y eso ensucia lo que Meta aprende. Lo pondría.
- **Banner de cookies.** El Pixel carga sin pedir consentimiento.
- **Página de gracias.** El documento pide mensaje de éxito en la misma página, así
  que el evento `Lead` se dispara al enviar, no en una URL aparte.
- **Datos estructurados JSON-LD** del negocio.

---

## 7. Pendiente de verificar en navegador

- [ ] Las dos imágenes del hero cargan y el texto se lee sobre ellas
- [ ] En móvil el popup aparece al 50% y se cierra con ✕, toque afuera y Escape
- [ ] El botón flotante marca al (832) 447-1511
- [ ] "Finance Me" lleva al formulario de abajo con el stock cargado
- [ ] El formulario muestra el error visible al enviar sin webhook
- [ ] Con `?utm_source=test&fbclid=abc`, los valores siguen guardados al enviar
- [ ] El enlace compartido en WhatsApp muestra imagen

---

## 8. Faltan cinco hex

La guía nombra Lot Navy, Slate, Concrete, Approved y Caution pero solo da el hex de
Hairline (`#DCDFE4`). Los cinco están puestos con valores aproximados en
`tokens.css`, marcados como por confirmar. Signal Red, Ink Black y Pure White sí
son los de la guía.

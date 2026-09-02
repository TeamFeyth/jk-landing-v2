/* Llave publica de prueba de Cloudflare Turnstile: siempre aprueba.
   Se sobreescribe con la llave real del panel de Cloudflare. */
const TEST_TURNSTILE_SITE_KEY = '1x00000000000000000000AA';

export const SITE_URL = import.meta.env.PUBLIC_SITE_URL ?? '';
export const ALLOW_INDEXING = import.meta.env.PUBLIC_ALLOW_INDEXING === 'true';

/* Token de verificacion de dominio de Meta.
   Necesario para configurar los 8 eventos priorizados de Aggregated Event
   Measurement. Sin eso, el trafico de iOS con ATT no atribuye, y la mayoria
   de estos leads llegan de m.facebook.com en movil.

   El token lo genera el equipo de ads en Business Settings -> Brand Safety ->
   Domains, en el portafolio que es DUENO del dataset (Feyth Marketing). Cada
   dominio tiene el suyo, asi que este valor NO es el mismo en los dos
   proyectos. Se pega en Cloudflare y listo, no hace falta tocar codigo. */
export const FB_DOMAIN_VERIFICATION = import.meta.env.PUBLIC_FB_DOMAIN_VERIFICATION ?? '';

/* Sin fallback a proposito. Antes habia un pixel de prueba por defecto y eso
   escondio durante semanas que PUBLIC_META_PIXEL_ID no estuviera surtiendo
   efecto: los eventos salian igual, pero a un dataset que no era el de la
   cuenta publicitaria. Un cero en Events Manager se detecta el primer dia;
   datos en el dataset equivocado, no. */
export const META_PIXEL_ID = import.meta.env.PUBLIC_META_PIXEL_ID ?? '';
export const REQUIRE_COOKIE_CONSENT = import.meta.env.PUBLIC_REQUIRE_COOKIE_CONSENT !== 'false';

/* El formulario habla con la funcion del mismo dominio, no con un webhook
   externo. Ahi se verifica el captcha y se arma el ADF para Neo CRM. */
export const LEAD_ENDPOINT = import.meta.env.PUBLIC_LEAD_ENDPOINT || '/api/lead';

export const CAPTCHA_PROVIDER = (import.meta.env.PUBLIC_CAPTCHA_PROVIDER ||
  'turnstile') as 'turnstile' | 'recaptcha' | 'none';

export const TURNSTILE_SITE_KEY =
  import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || TEST_TURNSTILE_SITE_KEY;

export const RECAPTCHA_SITE_KEY = import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY ?? '';

export const WEBHOOK_URL = import.meta.env.PUBLIC_WEBHOOK_URL ?? '';

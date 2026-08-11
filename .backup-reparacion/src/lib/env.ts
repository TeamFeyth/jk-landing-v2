/* Pixel de prueba entregado por Feyth. Se sobreescribe poniendo
   PUBLIC_META_PIXEL_ID en Cloudflare cuando llegue el definitivo. */
const TEST_PIXEL_ID = '1042412788159075';

/* Llave publica de prueba de Cloudflare Turnstile: siempre aprueba.
   Se sobreescribe con la llave real del panel de Cloudflare. */
const TEST_TURNSTILE_SITE_KEY = '1x00000000000000000000AA';

export const SITE_URL = import.meta.env.PUBLIC_SITE_URL ?? '';
export const ALLOW_INDEXING = import.meta.env.PUBLIC_ALLOW_INDEXING === 'true';
export const META_PIXEL_ID = import.meta.env.PUBLIC_META_PIXEL_ID || TEST_PIXEL_ID;
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

import { defineConfig } from 'astro/config';

const FALLBACK = 'https://jk-landing-v2.pages.dev';

/* Cloudflare puede entregar la variable vacia, sin esquema o con un espacio
   de mas. Cualquiera de esos casos rompia el build con "site: Invalid url".
   Aqui se normaliza y, si no hay forma de leerla, se usa el fallback. */
function resolveSite(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return FALLBACK;

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    return new URL(candidate).origin;
  } catch {
    console.warn(`[jk-landing-v2] PUBLIC_SITE_URL no es una URL valida ("${raw}"). Usando ${FALLBACK}.`);
    return FALLBACK;
  }
}

const siteUrl = resolveSite(process.env.PUBLIC_SITE_URL);

if (!process.env.PUBLIC_SITE_URL) {
  console.warn(`[jk-landing-v2] PUBLIC_SITE_URL sin definir. Usando ${FALLBACK}.`);
}

export default defineConfig({
  site: siteUrl,
  trailingSlash: 'ignore',
  compressHTML: true,
  build: { inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
});

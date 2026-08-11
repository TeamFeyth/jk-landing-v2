import { defineConfig } from 'astro/config';

const fallbackUrl = 'https://jk-landing-v2.pages.dev';
const siteUrl = process.env.PUBLIC_SITE_URL || fallbackUrl;

if (!process.env.PUBLIC_SITE_URL) {
  console.warn(`[jk-landing-v2] PUBLIC_SITE_URL sin definir. Usando ${fallbackUrl} para canonical y og:image.`);
}

export default defineConfig({
  site: siteUrl,
  trailingSlash: 'ignore',
  compressHTML: true,
  build: { inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
});

export const SITE_URL = import.meta.env.PUBLIC_SITE_URL ?? '';
export const ALLOW_INDEXING = import.meta.env.PUBLIC_ALLOW_INDEXING === 'true';
export const WEBHOOK_URL = import.meta.env.PUBLIC_WEBHOOK_URL ?? '';
export const META_PIXEL_ID = import.meta.env.PUBLIC_META_PIXEL_ID ?? '';
export const RECAPTCHA_SITE_KEY = import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY ?? '';
export const REQUIRE_COOKIE_CONSENT = import.meta.env.PUBLIC_REQUIRE_COOKIE_CONSENT !== 'false';

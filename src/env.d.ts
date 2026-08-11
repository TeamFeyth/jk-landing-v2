/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_ALLOW_INDEXING?: string;
  readonly PUBLIC_WEBHOOK_URL?: string;
  readonly PUBLIC_META_PIXEL_ID?: string;
  readonly PUBLIC_RECAPTCHA_SITE_KEY?: string;
  readonly PUBLIC_REQUIRE_COOKIE_CONSENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  fbq?: (...args: unknown[]) => void;
  _fbq?: unknown;
  grecaptcha?: {
    ready: (cb: () => void) => void;
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
  };
}

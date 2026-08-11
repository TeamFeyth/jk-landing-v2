import { REQUIRE_COOKIE_CONSENT } from './env';

const ATTR_KEY = 'jk_attr_v2';
const CONSENT_KEY = 'jk_consent_v2';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export type Attribution = {
  fbclid: string;
  fbc: string;
  fbp: string;
  landing_url: string;
  referrer: string;
} & Record<(typeof UTM_KEYS)[number], string>;

// Consentimiento

export function consentState(): 'granted' | 'denied' | 'unknown' {
  if (!REQUIRE_COOKIE_CONSENT) return 'granted';
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'granted' || stored === 'denied') return stored;
  } catch {
    return 'unknown';
  }
  return 'unknown';
}

export function setConsent(value: 'granted' | 'denied'): void {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    return;
  }
  document.dispatchEvent(new CustomEvent('jk:consent', { detail: value }));
}

export function hasConsent(): boolean {
  return consentState() === 'granted';
}

// Cookies

export function readCookie(name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : '';
}

// Atribución

function emptyAttribution(): Attribution {
  return {
    fbclid: '',
    fbc: '',
    fbp: '',
    landing_url: '',
    referrer: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: '',
  };
}

function readStored(): Attribution {
  try {
    const raw = sessionStorage.getItem(ATTR_KEY);
    if (!raw) return emptyAttribution();
    return { ...emptyAttribution(), ...(JSON.parse(raw) as Partial<Attribution>) };
  } catch {
    return emptyAttribution();
  }
}

function persist(data: Attribution): void {
  try {
    sessionStorage.setItem(ATTR_KEY, JSON.stringify(data));
  } catch {
    return;
  }
}

export function captureAttribution(): Attribution {
  const stored = readStored();
  const params = new URLSearchParams(window.location.search);

  for (const key of UTM_KEYS) {
    const incoming = params.get(key);
    if (incoming) stored[key] = incoming;
  }

  const fbclid = params.get('fbclid');
  if (fbclid) {
    stored.fbclid = fbclid;
    stored.fbc = `fb.1.${Date.now()}.${fbclid}`;
  }

  if (!stored.landing_url) stored.landing_url = window.location.href;
  if (!stored.referrer) stored.referrer = document.referrer || '';

  persist(stored);
  return stored;
}

export function getAttribution(): Attribution {
  const stored = readStored();
  const cookieFbc = readCookie('_fbc');
  const cookieFbp = readCookie('_fbp');
  return {
    ...stored,
    fbc: cookieFbc || stored.fbc,
    fbp: cookieFbp || stored.fbp,
  };
}

// Identificador de evento

export function newEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `jk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Puente con el Pixel

export function trackPixel(event: string, params: Record<string, unknown>, eventId: string): void {
  if (typeof window.fbq !== 'function') return;
  window.fbq('track', event, params, { eventID: eventId });
}

import { CAPTCHA_PROVIDER, LEAD_ENDPOINT, RECAPTCHA_SITE_KEY } from './env';
import { getAttribution, newEventId } from './tracking';
import { LANDING_ID } from '../data/site';

export type LeadSource = 'hero' | 'bottom' | 'popup';

export type LeadPayload = {
  landing: string;
  source: LeadSource;
  stock: string;
  event_id: string;
  name: string;
  phone: string;
  email: string;
  open_loan: string;
  employed: string;
  page_url: string;
  landing_url: string;
  referrer: string;
  submitted_at: string;
  fbc: string;
  fbp: string;
  fbclid: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  captcha_token: string;
  test: string;
};

export type LeadInput = {
  source: LeadSource;
  stock: string;
  name: string;
  phone: string;
  email: string;
  openLoan: string;
  employed: string;
};

// Captcha

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function getCaptchaToken(form: HTMLFormElement, action: string): Promise<string> {
  if (CAPTCHA_PROVIDER === 'recaptcha') {
    if (!RECAPTCHA_SITE_KEY || !window.grecaptcha) return '';
    try {
      await new Promise<void>((resolve) => window.grecaptcha!.ready(resolve));
      return await window.grecaptcha!.execute(RECAPTCHA_SITE_KEY, { action });
    } catch {
      return '';
    }
  }

  if (CAPTCHA_PROVIDER === 'turnstile') {
    const field = form.querySelector<HTMLInputElement>('input[name="captcha_token"]');
    for (let attempt = 0; attempt < 25; attempt += 1) {
      if (field?.value) return field.value;
      await wait(200);
    }
    return '';
  }

  return '';
}

export function resetCaptcha(form: HTMLFormElement): void {
  if (CAPTCHA_PROVIDER !== 'turnstile' || !window.turnstile) return;
  const widget = form.querySelector<HTMLElement>('[data-captcha-widget]');
  try {
    window.turnstile.reset(widget ?? undefined);
  } catch {
    return;
  }
}

// Payload

export function buildPayload(input: LeadInput, captchaToken: string): LeadPayload {
  const attribution = getAttribution();
  return {
    landing: LANDING_ID,
    source: input.source,
    stock: input.stock,
    event_id: newEventId(),
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    open_loan: input.openLoan,
    employed: input.employed,
    page_url: window.location.href,
    landing_url: attribution.landing_url,
    referrer: attribution.referrer,
    submitted_at: new Date().toISOString(),
    fbc: attribution.fbc,
    fbp: attribution.fbp,
    fbclid: attribution.fbclid,
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_content: attribution.utm_content,
    utm_term: attribution.utm_term,
    captcha_token: captchaToken,
    test: new URLSearchParams(window.location.search).get('jk_test') === '1' ? '1' : '',
  };
}

// Envio a la funcion /api/lead

export async function submitLead(payload: LeadPayload): Promise<void> {
  const response = await fetch(LEAD_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  });

  let data: { ok?: boolean; error?: string } = {};
  try {
    data = (await response.json()) as { ok?: boolean; error?: string };
  } catch {
    data = {};
  }

  if (!response.ok || data.ok !== true) {
    throw new Error(data.error ? `lead_endpoint: ${data.error}` : `lead_endpoint ${response.status}`);
  }
}

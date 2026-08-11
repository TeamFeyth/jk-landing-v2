import { WEBHOOK_URL, RECAPTCHA_SITE_KEY } from './env';
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
  recaptcha_token: string;
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

// reCAPTCHA v3

export async function getRecaptchaToken(action: string): Promise<string> {
  if (!RECAPTCHA_SITE_KEY || !window.grecaptcha) return '';
  try {
    await new Promise<void>((resolve) => window.grecaptcha!.ready(resolve));
    return await window.grecaptcha!.execute(RECAPTCHA_SITE_KEY, { action });
  } catch {
    return '';
  }
}

// Payload

export function buildPayload(input: LeadInput, recaptchaToken: string): LeadPayload {
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
    recaptcha_token: recaptchaToken,
  };
}

// Envío al webhook

export async function submitLead(payload: LeadPayload): Promise<void> {
  if (!WEBHOOK_URL) {
    throw new Error('PUBLIC_WEBHOOK_URL sin configurar');
  }

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  });

  if (!response.ok) {
    throw new Error(`Webhook respondió ${response.status}`);
  }
}

/*
  Variante para Google Apps Script

  Una app web de Apps Script no responde la petición de verificación previa
  (preflight OPTIONS) que dispara el encabezado 'Content-Type: application/json'.
  El envío falla desde el navegador aunque el script del lado de Google esté bien.

  Si se confirma que el destino del formulario es Apps Script, se reemplaza el
  cuerpo de submitLead() por esta versión. Con Zapier, Make o n8n no hace falta:
  esos sí manejan CORS.

  export async function submitLead(payload: LeadPayload): Promise<void> {
    if (!WEBHOOK_URL) {
      throw new Error('PUBLIC_WEBHOOK_URL sin configurar');
    }

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      keepalive: true,
    });

    if (!response.ok) {
      throw new Error(`Webhook respondió ${response.status}`);
    }
  }

  Lado de Apps Script:

  function doPost(e) {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.openById('SHEET_ID').getSheetByName('Leads');
    sheet.appendRow([
      data.submitted_at, data.landing, data.source, data.stock,
      data.name, data.phone, data.email, data.open_loan, data.employed,
      data.event_id, data.fbc, data.fbp, data.fbclid,
      data.utm_source, data.utm_medium, data.utm_campaign,
      data.utm_content, data.utm_term,
      data.page_url, data.referrer
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }
*/

/*
  POST /api/lead

  Corre en Cloudflare Pages Functions, en el mismo dominio que la landing.
  Hace cuatro cosas, en este orden:

    1. Valida el lead otra vez del lado servidor.
    2. Verifica el captcha con la secret key, que nunca sale de aqui.
    3. Arma el ADF XML que Neo CRM sabe importar.
    4. Lo entrega por correo y, si esta configurado, tambien a un webhook.

  Variables de entorno, todas en el panel de Cloudflare Pages
  (Settings -> Environment variables). Las que llevan secreto van marcadas
  como "Encrypt".

    CRM_EMAIL              destino del ADF. Por defecto el de Neo.
    MAIL_FROM              remitente verificado en el proveedor de correo.
    MAIL_REPLY_TO          opcional, para que "Responder" le escriba al cliente.

    RESEND_API_KEY         proveedor de correo preferido.
    MAILGUN_API_KEY        alternativa.
    MAILGUN_DOMAIN         dominio de envio de Mailgun.

    LEAD_FORWARD_URL       opcional. Copia del lead en JSON + ADF a
                           Zapier / Make / n8n / Google Apps Script.

    TURNSTILE_SECRET_KEY   captcha de Cloudflare. Es el camino por defecto.
    RECAPTCHA_SECRET_KEY   alternativa si se usan llaves de Google.
    CAPTCHA_MIN_SCORE      umbral de reCAPTCHA v3. Por defecto 0.5.

  Si no hay ningun canal de entrega configurado, la funcion responde 503 y el
  formulario muestra el error con el telefono. Nunca dice que el lead salio
  cuando no salio.
*/

const DEFAULTS = {
  crmEmail: 'jkamalcars@ledas.neoverify.com',
  mailFrom: 'John Kamal Cars <leads@jkamalcars.com>',
  minScore: 0.5,
  turnstileSecret: '1x0000000000000000000000000000000AA',
};

const DEALER = {
  id: '104878',
  name: 'John Kamal Cars',
  phone: '8324471511',
  street: '13141 Bissonnet St #C',
  city: 'Houston',
  region: 'TX',
  postal: '77099',
  country: 'US',
  source: 'jkamalcars.com',
};

const PROVIDER = {
  name: 'Feyth Marketing',
  service: 'Landing Page 2',
};

/* Punto de entrada */

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400);
  }

  if (typeof body.company === 'string' && body.company.trim() !== '') {
    return json({ ok: true, skipped: true });
  }

  const lead = normalizeLead(body);
  const invalid = validateLead(lead);
  if (invalid.length) {
    return json({ ok: false, error: 'invalid', fields: invalid }, 422);
  }

  const captcha = await verifyCaptcha(body, request, env);
  if (!captcha.ok) {
    return json({ ok: false, error: 'captcha', reason: captcha.reason }, 403);
  }

  lead.ip = request.headers.get('CF-Connecting-IP') || '';
  lead.country = request.cf && request.cf.country ? request.cf.country : '';
  lead.captcha_score = captcha.score;

  const adf = buildAdf(lead);

  const results = await Promise.allSettled([
    sendEmail(adf, lead, env),
    forwardWebhook(adf, lead, env),
  ]);

  const delivered = results.some((r) => r.status === 'fulfilled' && r.value === true);

  if (!delivered) {
    const reasons = results.map((r) =>
      r.status === 'rejected' ? String(r.reason && r.reason.message ? r.reason.message : r.reason) : 'skipped'
    );
    console.error('Ningun canal de entrega funciono', reasons);
    return json({ ok: false, error: 'not_delivered', reasons }, 503);
  }

  return json({ ok: true, event_id: lead.event_id });
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/* Normalizacion y validacion */

function normalizeLead(body) {
  const str = (value) => (typeof value === 'string' ? value.trim() : '');
  return {
    landing: str(body.landing) || 'lp',
    source: str(body.source) || 'hero',
    stock: str(body.stock),
    event_id: str(body.event_id) || crypto.randomUUID(),
    name: str(body.name).slice(0, 120),
    phone: digits(str(body.phone)),
    email: str(body.email).slice(0, 160),
    open_loan: yesNo(str(body.open_loan)),
    employed: yesNo(str(body.employed)),
    page_url: str(body.page_url).slice(0, 500),
    landing_url: str(body.landing_url).slice(0, 500),
    referrer: str(body.referrer).slice(0, 500),
    submitted_at: str(body.submitted_at) || new Date().toISOString(),
    fbc: str(body.fbc).slice(0, 200),
    fbp: str(body.fbp).slice(0, 200),
    fbclid: str(body.fbclid).slice(0, 200),
    utm_source: str(body.utm_source).slice(0, 120),
    utm_medium: str(body.utm_medium).slice(0, 120),
    utm_campaign: str(body.utm_campaign).slice(0, 160),
    utm_content: str(body.utm_content).slice(0, 160),
    utm_term: str(body.utm_term).slice(0, 160),
    ip: '',
    country: '',
    captcha_score: null,
  };
}

function validateLead(lead) {
  const bad = [];
  if (lead.name.length < 2 || !/[a-zà-ÿ]/i.test(lead.name)) bad.push('name');
  if (lead.phone.length !== 10 || /^[01]/.test(lead.phone)) bad.push('phone');
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(lead.email)) bad.push('email');
  if (!lead.open_loan) bad.push('open_loan');
  if (!lead.employed) bad.push('employed');
  return bad;
}

/* Captcha */

async function verifyCaptcha(body, request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const token = typeof body.captcha_token === 'string' ? body.captcha_token : '';
  const legacy = typeof body.recaptcha_token === 'string' ? body.recaptcha_token : '';

  const recaptchaSecret = env.RECAPTCHA_SECRET_KEY || '';
  if (recaptchaSecret) {
    const value = legacy || token;
    if (!value) return { ok: false, reason: 'missing_token', score: null };
    const data = await postForm('https://www.google.com/recaptcha/api/siteverify', {
      secret: recaptchaSecret,
      response: value,
      remoteip: ip,
    });
    const min = Number(env.CAPTCHA_MIN_SCORE || DEFAULTS.minScore);
    const score = typeof data.score === 'number' ? data.score : null;
    if (!data.success) return { ok: false, reason: 'recaptcha_failed', score };
    if (score !== null && score < min) return { ok: false, reason: 'low_score', score };
    return { ok: true, score };
  }

  const turnstileSecret = env.TURNSTILE_SECRET_KEY || DEFAULTS.turnstileSecret;
  const value = token || legacy;
  if (!value) return { ok: false, reason: 'missing_token', score: null };
  const data = await postForm('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    secret: turnstileSecret,
    response: value,
    remoteip: ip,
  });
  if (!data.success) return { ok: false, reason: 'turnstile_failed', score: null };
  return { ok: true, score: null };
}

async function postForm(url, fields) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value) form.append(key, value);
  }
  const response = await fetch(url, { method: 'POST', body: form });
  try {
    return await response.json();
  } catch {
    return { success: false };
  }
}

/* ADF XML */

function buildAdf(lead) {
  const vehicle = lookupVehicle(lead.stock);
  const person = splitName(lead.name);

  const out = [];
  out.push('<?xml version="1.0" encoding="UTF-8"?>');
  out.push('<?adf version="1.0"?>');
  out.push('<adf>');
  out.push('  <prospect status="new">');
  out.push(`    <id sequence="1" source="${DEALER.source}">${esc(lead.event_id)}</id>`);
  out.push(`    <requestdate>${esc(lead.submitted_at)}</requestdate>`);

  if (vehicle) {
    out.push('    <vehicle interest="buy" status="used">');
    out.push(`      <year>${esc(vehicle.year)}</year>`);
    out.push(`      <make>${esc(vehicle.make)}</make>`);
    out.push(`      <model>${esc(vehicle.model)}</model>`);
    if (vehicle.trim) out.push(`      <trim>${esc(vehicle.trim)}</trim>`);
    out.push(`      <stock>${esc(lead.stock)}</stock>`);
    out.push('    </vehicle>');
  }

  out.push('    <customer>');
  out.push('      <contact primarycontact="1">');
  out.push(`        <name part="first">${esc(person.first)}</name>`);
  out.push(`        <name part="last">${esc(person.last)}</name>`);
  out.push(`        <email>${esc(lead.email)}</email>`);
  out.push(`        <phone type="voice" time="day" preferredcontact="1">${esc(lead.phone)}</phone>`);
  out.push('      </contact>');
  out.push(`      <comments>${esc(buildComments(lead))}</comments>`);
  out.push('    </customer>');

  out.push('    <vendor>');
  out.push(`      <id sequence="1" source="${DEALER.source}">${DEALER.id}</id>`);
  out.push(`      <vendorname>${esc(DEALER.name)}</vendorname>`);
  out.push('      <contact>');
  out.push(`        <name part="full">${esc(DEALER.name)}</name>`);
  out.push(`        <phone type="voice">${DEALER.phone}</phone>`);
  out.push('        <address>');
  out.push(`          <street line="1">${esc(DEALER.street)}</street>`);
  out.push(`          <city>${DEALER.city}</city>`);
  out.push(`          <regioncode>${DEALER.region}</regioncode>`);
  out.push(`          <postalcode>${DEALER.postal}</postalcode>`);
  out.push(`          <country>${DEALER.country}</country>`);
  out.push('        </address>');
  out.push('      </contact>');
  out.push('    </vendor>');

  out.push('    <provider>');
  out.push(`      <name part="full">${esc(PROVIDER.name)}</name>`);
  out.push(`      <service>${esc(PROVIDER.service)}</service>`);
  out.push('    </provider>');

  out.push('  </prospect>');
  out.push('</adf>');

  return out.join('\n');
}

/* ADF no tiene campo propio para atribucion, asi que va etiquetada en comments */

function buildComments(lead) {
  const rows = [
    ['Open auto loan on another vehicle', lead.open_loan],
    ['Employed in the last 6 months', lead.employed],
    ['Form', lead.source],
    ['Landing', lead.landing],
    ['Event ID', lead.event_id],
    ['fbc', lead.fbc],
    ['fbp', lead.fbp],
    ['fbclid', lead.fbclid],
    ['utm_source', lead.utm_source],
    ['utm_medium', lead.utm_medium],
    ['utm_campaign', lead.utm_campaign],
    ['utm_content', lead.utm_content],
    ['utm_term', lead.utm_term],
    ['Page', lead.page_url],
    ['Referrer', lead.referrer],
    ['Country', lead.country],
  ];
  return rows.filter((row) => row[1]).map((row) => `${row[0]}: ${row[1]}`).join('\n');
}

/* Entrega por correo */

async function sendEmail(adf, lead, env) {
  const to = env.CRM_EMAIL || DEFAULTS.crmEmail;
  const from = env.MAIL_FROM || DEFAULTS.mailFrom;
  const subject = `ADF Lead — ${DEALER.name} — ${lead.name}`;
  const replyTo = env.MAIL_REPLY_TO || lead.email;

  if (env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: replyTo,
        subject,
        text: adf,
        attachments: [
          {
            filename: `adf-${lead.event_id}.xml`,
            content: base64(adf),
          },
        ],
      }),
    });
    if (!response.ok) {
      throw new Error(`resend ${response.status} ${await safeText(response)}`);
    }
    return true;
  }

  if (env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN) {
    const form = new FormData();
    form.append('from', from);
    form.append('to', to);
    form.append('h:Reply-To', replyTo);
    form.append('subject', subject);
    form.append('text', adf);

    const response = await fetch(`https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}` },
      body: form,
    });
    if (!response.ok) {
      throw new Error(`mailgun ${response.status} ${await safeText(response)}`);
    }
    return true;
  }

  console.warn('Sin proveedor de correo configurado. ADF generado:\n' + adf);
  return false;
}

/* Copia al webhook, que alimenta el Google Sheet */

async function forwardWebhook(adf, lead, env) {
  if (!env.LEAD_FORWARD_URL) return false;

  const response = await fetch(env.LEAD_FORWARD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...lead, adf_xml: adf }),
  });

  if (!response.ok) {
    throw new Error(`forward ${response.status}`);
  }
  return true;
}

/* Utilidades */

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function digits(value) {
  const only = String(value || '').replace(/\D+/g, '');
  if (only.length === 11 && only.startsWith('1')) return only.slice(1);
  return only;
}

function yesNo(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'yes' || normalized === 'si' || normalized === 'sí') return 'Yes';
  if (normalized === 'no') return 'No';
  return '';
}

function splitName(full) {
  const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function base64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function safeText(response) {
  try {
    return (await response.text()).slice(0, 200);
  } catch {
    return '';
  }
}

/* Tabla de stock. Se mantiene junto a src/data/vehicles.ts */

function lookupVehicle(stock) {
  const table = VEHICLE_TABLE[stock];
  return table || null;
}

const VEHICLE_TABLE = {
  '212255': { year: '2017', make: 'Honda', model: 'Accord', trim: 'LX CVT' },
  '843051': { year: '2018', make: 'Nissan', model: 'Rogue', trim: 'FWD SL' },
  'A62810': { year: '2022', make: 'Ford', model: 'Expedition', trim: 'Platinum' },
};

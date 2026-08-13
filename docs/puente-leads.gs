/*
  Puente de entrega de leads: Cloudflare Pages Function -> Google Apps Script.

  La landing es estatica y no puede mandar correo. La funcion /api/lead arma el
  ADF XML y hace POST de { ...lead, adf_xml } a este script (env LEAD_FORWARD_URL).
  Este script hace dos cosas:

    1. Manda el ADF a Neo por correo (cuerpo de texto + adjunto .xml).
    2. Escribe una fila de respaldo en un Google Sheet, para enterarse si el
       buzon del CRM deja de recibir. Sin esta copia, un lead perdido no avisa.

  Despliegue (una sola vez, depende solo de la cuenta de Google de la agencia):
    1. script.google.com -> New project -> pegar este archivo.
    2. Llenar SHEET_ID con el id de un Google Sheet propio (opcional pero
       recomendado). El CRM_EMAIL ya viene puesto.
    3. Deploy -> New deployment -> Web app.
         Execute as: Me
         Who has access: Anyone
    4. Copiar la URL /exec y ponerla en Cloudflare Pages como LEAD_FORWARD_URL,
       en las dos landings, en Production y Preview por separado. Redeploy.

  El remitente es la cuenta de Google que despliega. No suplanta al cliente:
  el correo del cliente viaja en Reply-To y dentro del ADF. Si Neo filtra por
  remitente autorizado, hay que pedirle a John/Noopur que agregue esa cuenta.
*/

/* Configuracion */

var CRM_EMAIL = 'jkamalcars@ledas.neoverify.com';
var SHEET_ID = '';
var SENDER_NAME = 'John Kamal Cars Leads';

/* Entrada */

function doPost(e) {
  try {
    var lead = JSON.parse(e.postData.contents);
    var adf = String(lead.adf_xml || '');
    if (!adf) return reply({ ok: false, error: 'missing_adf' });

    deliverEmail(lead, adf);
    backupRow(lead);

    return reply({ ok: true, event_id: lead.event_id || '' });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

function doGet() {
  return reply({ ok: true, service: 'puente-leads', crm: CRM_EMAIL });
}

/* Correo a Neo */

function deliverEmail(lead, adf) {
  var isTest = truthy(lead.test);
  var name = lead.name || 'Lead';
  var subject = (isTest ? '[TEST] ' : '') + 'ADF Lead — John Kamal Cars — ' + name;
  var filename = 'adf-' + (lead.event_id || Date.now()) + '.xml';

  var options = {
    name: SENDER_NAME,
    attachments: [Utilities.newBlob(adf, 'application/xml', filename)],
  };
  if (lead.email) options.replyTo = lead.email;

  MailApp.sendEmail(CRM_EMAIL, subject, adf, options);
}

/* Respaldo en Sheet */

function backupRow(lead) {
  if (!SHEET_ID) return;
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  sheet.appendRow([
    new Date(),
    truthy(lead.test) ? 'TEST' : 'LIVE',
    lead.landing || '',
    lead.source || '',
    lead.name || '',
    lead.phone || '',
    lead.email || '',
    lead.stock || '',
    lead.event_id || '',
    lead.utm_campaign || '',
    lead.fbclid || '',
    lead.adf_xml || '',
  ]);
}

/* Utilidades */

function truthy(value) {
  return /^(1|true|yes|si|sí)$/i.test(String(value == null ? '' : value).trim());
}

function reply(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

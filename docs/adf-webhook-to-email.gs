/*
  Puente formulario -> ADF XML -> correo a Neo CRM

  La landing es estatica y un navegador no puede enviar correo, asi que el
  formulario sigue mandando JSON a PUBLIC_WEBHOOK_URL. Esta capa lo recibe,
  lo convierte a ADF y lo manda a la direccion de importacion de Neo.

  Sirve igual en Make, Zapier o n8n: lo que cambia es solo como se recibe el
  POST y como se manda el correo. La funcion buildAdf() es la misma.

  Si el destino termina siendo Apps Script, hay que activar la variante
  text/plain en src/lib/leads.ts. Ver el bloque comentado al final de ese archivo.
*/

var CRM_EMAIL = 'jkamalcars@ledas.neoverify.com';
var SHEET_ID = '';
var SHEET_NAME = 'Leads';

function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  if (SHEET_ID) {
    appendToSheet(data);
  }

  MailApp.sendEmail({
    to: CRM_EMAIL,
    subject: 'ADF Lead - John Kamal Cars - ' + (data.name || 'New lead'),
    body: buildAdf(data),
  });

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* Construccion del ADF */

function buildAdf(data) {
  var vehicle = parseVehicle(data.stock);
  var name = splitName(data.name);

  var lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<?adf version="1.0"?>');
  lines.push('<adf>');
  lines.push('  <prospect status="new">');
  lines.push('    <id sequence="1" source="jkamalcars.com">' + esc(data.event_id) + '</id>');
  lines.push('    <requestdate>' + esc(data.submitted_at) + '</requestdate>');

  if (vehicle) {
    lines.push('    <vehicle interest="buy" status="used">');
    lines.push('      <year>' + esc(vehicle.year) + '</year>');
    lines.push('      <make>' + esc(vehicle.make) + '</make>');
    lines.push('      <model>' + esc(vehicle.model) + '</model>');
    lines.push('      <stock>' + esc(data.stock) + '</stock>');
    lines.push('    </vehicle>');
  }

  lines.push('    <customer>');
  lines.push('      <contact primarycontact="1">');
  lines.push('        <name part="first">' + esc(name.first) + '</name>');
  lines.push('        <name part="last">' + esc(name.last) + '</name>');
  lines.push('        <email>' + esc(data.email) + '</email>');
  lines.push('        <phone type="voice" preferredcontact="1">' + esc(digits(data.phone)) + '</phone>');
  lines.push('      </contact>');
  lines.push('      <comments>' + esc(buildComments(data)) + '</comments>');
  lines.push('    </customer>');

  lines.push('    <vendor>');
  lines.push('      <vendorname>John Kamal Cars</vendorname>');
  lines.push('      <contact>');
  lines.push('        <name part="full">John Kamal Cars</name>');
  lines.push('        <email>' + CRM_EMAIL + '</email>');
  lines.push('        <phone type="voice">8324471511</phone>');
  lines.push('        <address>');
  lines.push('          <street line="1">13141 Bissonnet St #C</street>');
  lines.push('          <city>Houston</city>');
  lines.push('          <regioncode>TX</regioncode>');
  lines.push('          <postalcode>77099</postalcode>');
  lines.push('          <country>US</country>');
  lines.push('        </address>');
  lines.push('      </contact>');
  lines.push('    </vendor>');

  lines.push('    <provider>');
  lines.push('      <name part="full">Feyth Marketing</name>');
  lines.push('      <service>Landing Page 2</service>');
  lines.push('    </provider>');

  lines.push('  </prospect>');
  lines.push('</adf>');

  return lines.join('\n');
}

/* Lo que ADF no tiene campo propio viaja en comments */

function buildComments(data) {
  var rows = [
    ['Open auto loan on another vehicle', yesNo(data.open_loan)],
    ['Employed in the last 6 months', yesNo(data.employed)],
    ['Form', data.source],
    ['Landing', data.landing],
    ['Event ID', data.event_id],
    ['fbc', data.fbc],
    ['fbp', data.fbp],
    ['utm_source', data.utm_source],
    ['utm_medium', data.utm_medium],
    ['utm_campaign', data.utm_campaign],
    ['utm_content', data.utm_content],
    ['utm_term', data.utm_term],
    ['Page', data.page_url],
    ['Referrer', data.referrer],
  ];

  var out = [];
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][1]) out.push(rows[i][0] + ': ' + rows[i][1]);
  }
  return out.join('\n');
}

/* Utilidades */

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function digits(value) {
  return String(value || '').replace(/\D+/g, '').slice(-10);
}

function yesNo(value) {
  if (value === 'yes') return 'Yes';
  if (value === 'no') return 'No';
  return '';
}

function splitName(full) {
  var parts = String(full || '').trim().split(/\s+/);
  if (parts.length < 2) return { first: parts[0] || '', last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

/* Tabla de stock -> vehiculo. Se actualiza junto con src/data/vehicles.ts */

function parseVehicle(stock) {
  var table = {
    '212255': { year: '2017', make: 'Honda', model: 'Accord' },
    '843051': { year: '2018', make: 'Nissan', model: 'Rogue' },
    'A62810': { year: '2022', make: 'Ford', model: 'Expedition' },
  };
  return table[stock] || null;
}

function appendToSheet(data) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  sheet.appendRow([
    data.submitted_at, data.landing, data.source, data.stock,
    data.name, data.phone, data.email, data.open_loan, data.employed,
    data.event_id, data.fbc, data.fbp, data.fbclid,
    data.utm_source, data.utm_medium, data.utm_campaign,
    data.utm_content, data.utm_term,
    data.page_url, data.referrer,
  ]);
}

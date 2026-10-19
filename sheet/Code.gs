/** @OnlyCurrentDoc */
/**
 * LS&Co. demo – auth table in a Google Sheet.
 * The web portal WRITES the current auth state here; the Virtual Agent (via Cloud Run) READS it.
 *
 * Tabs (created automatically on first write if missing):
 *   Auth  one row per key (default "current"), overwritten on every change
 *         key | auth_status | first_name | last_name | email | user_id | store_id | language | updated_at | source
 *   Log   every change appended (handy while testing; safe to clear)
 *
 * Setup: Extensions > Apps Script > paste this file > Save
 *        Project Settings > Script properties > DEMO_KEY = any random string (also put it in the portal config.js)
 *        Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone > Deploy > copy the /exec URL
 *        After editing this code: Deploy > Manage deployments > Edit > Version: New version (keeps the same URL)
 *
 * Read (VA / Cloud Run / later the Tampermonkey injector):
 *   GET <exec URL>?action=get&key=current&token=DEMO_KEY
 *   -> { "ok": true, "auth": { "key":"current", "auth_status":true, "first_name":"Amanda", "last_name":"Scarpin",
 *                              "email":"amanda.scarpin@example.com", "user_id":"E322001", ... } }
 * Write (portal):
 *   POST <exec URL>  body (text/plain): {"action":"set","token":"DEMO_KEY","row":{...}}
 */
const AUTH = 'Auth';
const LOG = 'Log';
const COLS = ['key', 'auth_status', 'first_name', 'last_name', 'email', 'user_id', 'store_id', 'language', 'updated_at', 'source'];

// Run once from the editor (select "setup" > Run): asks for permission, creates the Auth + Log tabs
// and writes the signed-out row, so the sheet is ready before the first portal visit.
function setup() {
  upsert_(clean_({ key: 'current', auth_status: false, source: 'setup' }));
  sheet_(LOG);
  Logger.log('Ready. Auth tab: ' + JSON.stringify(find_('current')));
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (!authorised_(p.token)) return json_({ ok: false, error: 'bad token' });
  if ((p.action || 'get') === 'get') {
    const row = find_(String(p.key || 'current'));
    return json_({ ok: !!row, auth: row || unauthenticated_(String(p.key || 'current')) });
  }
  return json_({ ok: false, error: 'unknown action' });
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse((e.postData && e.postData.contents) || '{}'); } catch (err) { return json_({ ok: false, error: 'bad JSON' }); }
  if (!authorised_(body.token)) return json_({ ok: false, error: 'bad token' });
  if (body.action === 'set' && body.row) {
    const row = clean_(body.row);
    const lock = LockService.getScriptLock(); lock.waitLock(5000);
    try { upsert_(row); log_(row); } finally { lock.releaseLock(); }
    return json_({ ok: true, auth: row });
  }
  return json_({ ok: false, error: 'unknown action' });
}

/* ---------- helpers ---------- */
function authorised_(token) {
  const key = PropertiesService.getScriptProperties().getProperty('DEMO_KEY');
  return !key || token === key;
}
function sheet_(name) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(name === LOG ? ['logged_at'].concat(COLS) : COLS); sh.setFrozenRows(1); }
  return sh;
}
function clean_(r) {
  const o = {};
  COLS.forEach(c => { o[c] = r[c] === undefined || r[c] === null ? '' : r[c]; });
  o.key = String(o.key || 'current');
  o.auth_status = o.auth_status === true || String(o.auth_status).toLowerCase() === 'true';
  if (!o.auth_status) { o.first_name = ''; o.last_name = ''; o.email = ''; o.user_id = ''; o.store_id = ''; }
  o.updated_at = o.updated_at || new Date().toISOString();
  return o;
}
function unauthenticated_(key) { return clean_({ key: key, auth_status: false, updated_at: '' }); }
function find_(key) {
  const v = sheet_(AUTH).getDataRange().getValues();
  const head = v.shift();
  const r = v.find(x => String(x[0]) === key);
  if (!r) return null;
  const o = {};
  head.forEach((h, i) => { o[h] = r[i] instanceof Date ? r[i].toISOString() : r[i]; });
  o.auth_status = o.auth_status === true || String(o.auth_status).toLowerCase() === 'true';
  return o;
}
function upsert_(row) {
  const sh = sheet_(AUTH);
  const keys = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getValues().map(x => String(x[0]));
  const at = keys.indexOf(row.key);
  const values = [COLS.map(c => row[c])];
  if (at > 0) sh.getRange(at + 1, 1, 1, COLS.length).setValues(values);
  else sh.appendRow(values[0]);
}
function log_(row) { sheet_(LOG).appendRow([new Date().toISOString()].concat(COLS.map(c => row[c]))); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

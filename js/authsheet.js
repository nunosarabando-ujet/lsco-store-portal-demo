// Writes the portal's current auth state to the Google Sheet (via the Apps Script web app in /sheet).
// The Virtual Agent (Adam, via Cloud Run) reads the same row, so it always sees the latest state,
// even if the chat started before the user signed in.
//
// Row written (one row per CONFIG.AUTH_SHEET.key, default "current"):
//   key | auth_status | first_name | last_name | email | user_id | store_id | language | updated_at | source
import { CONFIG } from "../config.js";
import { state } from "./state.js";

const S = () => CONFIG.AUTH_SHEET;
let last = { ok: null, at: null, error: null, row: null };
let queue = Promise.resolve();
const listeners = new Set();

export function currentRow() {
  const p = state.persona;
  const base = { key: S().key, updated_at: new Date().toISOString(), source: location.host || "local" };
  if (!p) return { ...base, auth_status: false, first_name: "", last_name: "", email: "", user_id: "", store_id: "", language: "" };
  const [first, ...rest] = p.name.split(" ");
  return { ...base, auth_status: true, first_name: first, last_name: rest.join(" "), email: p.email,
    user_id: p.employeeId, store_id: p.storeId, language: p.language };
}

async function post(row) {
  // text/plain keeps this a "simple" request (no CORS preflight), which Apps Script accepts
  const r = await fetch(S().url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "set", token: S().token, row }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.ok === false) throw new Error(j.error || "HTTP " + r.status);
}

// Queue writes so a fast sign-in/sign-out never lands out of order
export function syncAuth(reason = "") {
  const row = currentRow();
  if (!S().enabled || !S().url || S().url.includes("REPLACE")) {
    last = { ok: null, at: new Date(), error: "sheet not configured", row };
    console.log("[LSCO auth sheet] not configured – would write", row);
    listeners.forEach(f => f(last));
    return Promise.resolve();
  }
  queue = queue.then(async () => {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try { await post(row); last = { ok: true, at: new Date(), error: null, row }; console.log("[LSCO auth sheet] saved", reason, row); break; }
      catch (e) { last = { ok: false, at: new Date(), error: e.message, row }; console.warn("[LSCO auth sheet] write failed", attempt, e.message); }
    }
    listeners.forEach(f => f(last));
  });
  return queue;
}

export const authSyncStatus = () => last;
export const onAuthSync = fn => (listeners.add(fn), () => listeners.delete(fn));

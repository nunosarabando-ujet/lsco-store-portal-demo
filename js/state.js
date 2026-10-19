// Current persona, store, language and data source. Kept in sessionStorage.
// The Tampermonkey userscript also reads "lsco.session" (same origin) as a fallback.
import { CONFIG } from "../config.js";

const KEY = "lsco.session";
const DS_KEY = "lsco.dataSource";
const listeners = new Set();

function read(k) { try { return JSON.parse(sessionStorage.getItem(k) || "null"); } catch { return null; } }
function write(k, v) { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, JSON.stringify(v)); } catch {} }

let session = read(KEY);

export const state = {
  get session() { return session; },
  get persona() { return session?.persona || null; },
  get storeId() { return session?.persona?.storeId || null; },
  get lang() { return session?.persona?.language || "en"; },
  get signedIn() { return !!session; },
  get dataSource() { return read(DS_KEY) || CONFIG.DATA_SOURCE; },

  setSession(s) {
    session = s ? { ...s, signedInAt: s.signedInAt || new Date().toISOString() } : null;
    write(KEY, session);
    window.dispatchEvent(new CustomEvent("lsco:session", { detail: session ? JSON.stringify(session.persona) : null }));
    listeners.forEach(fn => fn("session"));
  },
  setDataSource(ds) { write(DS_KEY, ds); listeners.forEach(fn => fn("datasource")); },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
};

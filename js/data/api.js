// API adapter: calls levis-portal-auth (Prompt B). Bearer portalToken, 8 s timeout,
// per-endpoint last-good cache, toast + fallback on failure. Never throws to the page for reads.
import { CONFIG } from "../../config.js";
import { state } from "../state.js";
import { toast } from "../components/ui.js";
import { mock } from "./mock.js";

const cache = new Map();
let lastToast = 0;

async function call(path, { method = "GET", body, fallback = null } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 8000);
  try {
    const headers = { Accept: "application/json" };
    if (body) headers["Content-Type"] = "application/json";
    const tok = state.session?.portalToken;
    if (tok) headers.Authorization = "Bearer " + tok;
    const r = await fetch(CONFIG.API_BASE_URL.replace(/\/$/, "") + path, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: ctl.signal });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const json = await r.json();
    cache.set(path, json);
    api.source = json.source || "servicenow";
    return json;
  } catch (e) {
    console.warn("[LSCO api]", path, e.message);
    if (Date.now() - lastToast > 10000) { toast("Live data unavailable – showing cached data", "warn"); lastToast = Date.now(); }
    if (method !== "GET") throw e;
    return cache.has(path) ? cache.get(path) : fallback;
  } finally { clearTimeout(timer); }
}
const qs = o => { const p = new URLSearchParams(); for (const k in o) if (o[k]) p.set(k, o[k]); const s = p.toString(); return s ? "?" + s : ""; };
const items = r => (Array.isArray(r) ? r : r?.items || []);

export const api = {
  source: "servicenow",
  async signIn(personaId) { return call("/auth/token", { method: "POST", body: { personaId } }); },
  // Static/public data is served from the bundled JSON in every mode.
  listPersonas: () => mock.listPersonas(),
  listStores: () => mock.listStores(),
  listCategories: () => mock.listCategories(),
  listFixtures: () => mock.listFixtures(),
  getPublicOutage: () => mock.getPublicOutage(),

  getSummary: id => call(`/portal/stores/${id}/summary`, { fallback: { techOpen: "–", opsOpen: "–", questions: "–", hardwareOpen: "–", source: "unavailable", refreshedAt: null } }),
  listTickets: async (id, f = {}) => items(await call(`/portal/stores/${id}/tickets${qs(f)}`, { fallback: [] })),
  getTicket: n => call(`/portal/tickets/${encodeURIComponent(n)}`),
  listOrders: async id => items(await call(`/portal/stores/${id}/orders`, { fallback: [] })),
  getOrder: n => call(`/portal/orders/${encodeURIComponent(n)}`),
  listDevices: async (id, f = {}) => items(await call(`/portal/stores/${id}/devices${qs(f)}`, { fallback: [] })),
  getDevice: s => call(`/portal/devices/${encodeURIComponent(s)}`),
  listKb: async (f = {}) => items(await call(`/portal/kb${qs(f)}`, { fallback: [] })),
  getKb: (id, lang) => call(`/portal/kb/${encodeURIComponent(id)}${qs({ lang })}`),
  getStoreStatus: id => call(`/portal/stores/${id}/status`),
  search: (storeId, q) => call(`/portal/search${qs({ storeId, q })}`, { fallback: { tickets: [], orders: [], devices: [], kb: [] } }),
  simulate: null
};

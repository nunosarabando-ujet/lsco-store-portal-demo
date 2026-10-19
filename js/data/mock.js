// Mock adapter: reads /data/*.json, keeps changes for the browser session (sessionStorage),
// and exposes simulate.* for the presenter panel.
const FILES = ["personas", "stores", "tickets", "orders", "devices", "kb", "categories", "fixtures"];
const DB_KEY = "lsco.mockdb";
const OPEN = ["New", "In Progress", "On Hold"];
let db = null;

const base = new URL("../../data/", import.meta.url);

// "-3d 10:02" / "+2d" / "-0d 09:12" → ISO, so seed dates always look recent.
function rel(v) {
  const m = typeof v === "string" && v.match(/^([+-])(\d+)d(?:\s+(\d\d):(\d\d))?$/);
  if (!m) return v;
  const d = new Date();
  d.setDate(d.getDate() + (m[1] === "-" ? -1 : 1) * +m[2]);
  if (m[3]) d.setHours(+m[3], +m[4], 0, 0);
  return d.toISOString();
}
function resolveDates(o) {
  if (Array.isArray(o)) return o.map(resolveDates);
  if (o && typeof o === "object") { const r = {}; for (const k in o) r[k] = resolveDates(o[k]); return r; }
  return rel(o);
}

async function loadSeed() {
  const parts = await Promise.all(FILES.map(f => fetch(new URL(f + ".json", base)).then(r => { if (!r.ok) throw new Error(f); return r.json(); })));
  const seed = {}; FILES.forEach((f, i) => (seed[f] = resolveDates(parts[i])));
  return seed;
}
async function ensure() {
  if (db) return db;
  try { db = JSON.parse(sessionStorage.getItem(DB_KEY) || "null"); } catch { db = null; }
  if (!db) { db = await loadSeed(); save(); }
  return db;
}
function save() { try { sessionStorage.setItem(DB_KEY, JSON.stringify(db)); } catch {} }
const now = () => new Date().toISOString();
const clone = o => JSON.parse(JSON.stringify(o));

function activeOutageFor(storeId) {
  const store = db.stores.find(s => s.id === storeId);
  if (!store) return null;
  return db.tickets.find(t => t.majorIncident && t.region === store.region && OPEN.includes(t.state)) || null;
}
function deviceStatus(d) {
  const out = activeOutageFor(d.storeId);
  return out && d.type === "gateway" ? "DOWN" : d.status;
}
function slimTicket(t) {
  return { number: t.number, shortDescription: t.shortDescription, state: t.state, priority: t.priority,
    category: t.category, type: t.type, updatedAt: t.updatedAt, storeId: t.storeId };
}
function replacements90(storeId) {
  const cutoff = Date.now() - 90 * 864e5;
  return db.orders.filter(o => o.storeId === storeId && /replacement ipad/i.test(o.item) && new Date(o.openedAt).getTime() >= cutoff).length;
}

export const mock = {
  source: "mock",

  async signIn(personaId) {
    await ensure();
    const persona = db.personas.find(p => p.id === personaId);
    if (!persona) throw new Error("Unknown persona");
    return { persona: clone(persona), ujetToken: null, portalToken: null, source: "mock" };
  },
  async listPersonas() { await ensure(); return clone(db.personas); },
  async listStores() { await ensure(); return clone(db.stores); },
  async listCategories() { await ensure(); return clone(db.categories); },
  async listFixtures() { await ensure(); return clone(db.fixtures); },

  async getSummary(storeId) {
    await ensure();
    const mine = db.tickets.filter(t => t.storeId === storeId && OPEN.includes(t.state));
    return {
      techOpen: mine.filter(t => t.type === "tech").length,
      opsOpen: mine.filter(t => t.type === "ops").length,
      questions: mine.filter(t => t.type === "question").length,
      hardwareOpen: db.orders.filter(o => o.storeId === storeId && o.stage !== "Delivered").length,
      source: "mock", refreshedAt: now()
    };
  },

  async listTickets(storeId, { state = "open", type = "", q = "" } = {}) {
    await ensure();
    const ql = q.toLowerCase();
    return db.tickets
      .filter(t => t.storeId === storeId)
      .filter(t => state === "open" ? OPEN.includes(t.state) : state === "on_hold" ? t.state === "On Hold"
        : state === "resolved" ? ["Resolved", "Closed"].includes(t.state) : true)
      .filter(t => !type || t.type === type)
      .filter(t => !ql || (t.number + " " + t.shortDescription + " " + t.category).toLowerCase().includes(ql))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(slimTicket);
  },

  async getTicket(number) {
    await ensure();
    const t = db.tickets.find(x => x.number === number);
    if (!t) return null;
    return { ...clone(t), children: db.tickets.filter(c => c.parent === number).map(c => c.number), snowSysId: null,
      timeline: [...t.timeline].sort((a, b) => b.at.localeCompare(a.at)) };
  },

  async listOrders(storeId) {
    await ensure();
    return db.orders.filter(o => o.storeId === storeId).sort((a, b) => b.openedAt.localeCompare(a.openedAt))
      .map(o => ({ number: o.number, item: o.item, serial: o.serial, stage: o.stage, eta: o.eta, openedAt: o.openedAt }));
  },
  async getOrder(number) { await ensure(); const o = db.orders.find(x => x.number === number); return o ? { ...clone(o), snowSysId: null } : null; },

  async listDevices(storeId, { type = "" } = {}) {
    await ensure();
    return db.devices.filter(d => d.storeId === storeId && (!type || d.type === type))
      .map(d => ({ serial: d.serial, name: d.name, type: d.type, status: deviceStatus(d), location: d.location }));
  },
  async getDevice(serial) {
    await ensure();
    const d = db.devices.find(x => x.serial === serial);
    if (!d) return null;
    return { ...clone(d), status: deviceStatus(d),
      openTickets: db.tickets.filter(t => t.ci === serial && OPEN.includes(t.state)).map(t => t.number),
      replacementsLast90d: replacements90(d.storeId) };
  },

  async listKb({ q = "", category = "", lang = "en" } = {}) {
    await ensure();
    const ql = q.toLowerCase();
    return db.kb.map(a => localize(a, lang))
      .filter(a => (!category || a.category === category) && (!ql || (a.title + " " + a.body).toLowerCase().includes(ql)))
      .map(({ id, title, category, lang }) => ({ id, title, category, lang }));
  },
  async getKb(id, lang = "en") { await ensure(); const a = db.kb.find(x => x.id === id); return a ? localize(a, lang) : null; },

  async getStoreStatus(storeId) {
    await ensure();
    const store = db.stores.find(s => s.id === storeId);
    if (!store) return null;
    const out = activeOutageFor(storeId);
    const devs = db.devices.filter(d => d.storeId === storeId);
    const comp = (type, label) => {
      const ds = devs.filter(d => d.type === type).map(deviceStatus);
      const status = !ds.length ? "UP" : ds.includes("DOWN") ? (ds.every(s => s === "DOWN") ? "DOWN" : "DEGRADED") : ds.includes("DEGRADED") ? "DEGRADED" : "UP";
      return { component: label, status };
    };
    return {
      store: clone(store),
      health: [comp("gateway", "Internet / gateway"), comp("switch", "Switch"), comp("ap", "Wi-Fi"), comp("pos", "POS / EPOS")],
      activeOutage: out ? { number: out.number, shortDescription: out.shortDescription, state: out.state } : null,
      affectedStores: out ? db.stores.filter(s => s.region === store.region && s.circuit === store.circuit).map(s => ({ id: s.id, name: s.name })) : [],
      source: "mock"
    };
  },

  // Public (signed-out) banner: any active major incident.
  async getPublicOutage() {
    await ensure();
    const out = db.tickets.find(t => t.majorIncident && OPEN.includes(t.state));
    if (!out) return null;
    return { number: out.number, region: out.region, stores: db.stores.filter(s => s.region === out.region).length };
  },

  async search(storeId, q) {
    await ensure();
    const ql = (q || "").toLowerCase();
    const has = s => String(s).toLowerCase().includes(ql);
    return {
      tickets: db.tickets.filter(t => t.storeId === storeId && has(t.number + " " + t.shortDescription)).map(slimTicket),
      orders: db.orders.filter(o => o.storeId === storeId && has(o.number + " " + o.item + " " + o.serial)),
      devices: db.devices.filter(d => d.storeId === storeId && has(d.serial + " " + d.name)).map(d => ({ ...d, status: deviceStatus(d) })),
      kb: db.kb.filter(a => has(a.title + " " + a.body + " " + (a.pt?.title || ""))).map(a => ({ id: a.id, title: a.title, category: a.category }))
    };
  },

  /* ---------- presenter simulations (mock mode only) ---------- */
  simulate: {
    async createIpadOrder(storeId = "322", serial = "DMPX3221A") {
      await ensure();
      const store = db.stores.find(s => s.id === storeId);
      const n = "RITM00" + (10480 + db.orders.length);
      const at = now();
      db.orders.unshift({ number: n, storeId, item: "Replacement iPad", serial, stage: "Approved", eta: rel("+2d"), openedAt: at,
        shipTo: `Store #${storeId}, ${store?.address || ""}`, tracking: "", reason: "Broken screen",
        history: [{ at, stage: "Requested" }, { at, stage: "Approved" }] });
      save(); return n;
    },
    async startOutage() {
      await ensure();
      for (const n of ["INC0010301", "INC0010302", "INC0010303"]) { const t = db.tickets.find(x => x.number === n); if (t) { t.state = "In Progress"; t.updatedAt = now(); } }
      save();
    },
    async resolveOutage() {
      await ensure();
      for (const n of ["INC0010301", "INC0010302", "INC0010303"]) {
        const t = db.tickets.find(x => x.number === n);
        if (t) { t.state = "Resolved"; t.updatedAt = now(); t.timeline.push({ at: now(), author: "Network Operations", kind: "comment", text: "Circuit restored by the ISP. All stores back online." }); }
      }
      save();
    },
    async addComment(number = "INC0010234") {
      await ensure();
      const t = db.tickets.find(x => x.number === number); if (!t) return;
      t.timeline.push({ at: now(), author: "Store IT Service Desk", kind: "comment", text: "Complaint logged after call with Stitch (PT→EN). Courier escalated: delivery moved to tomorrow morning." });
      t.updatedAt = now(); save();
    },
    async putOnHold(number = "INC0010276") {
      await ensure();
      const t = db.tickets.find(x => x.number === number); if (!t) return;
      t.state = "On Hold"; t.holdReason = "Awaiting Caller"; t.updatedAt = now();
      t.timeline.push({ at: now(), author: "Store IT Service Desk", kind: "comment", text: "Need the store manager to confirm when Till 2 can be swapped (outbound follow-up by Stitch scheduled)." });
      save();
    },
    async reset() { db = await loadSeed(); save(); }
  }
};

function localize(a, lang) {
  if (lang === "pt" && a.pt) return { id: a.id, category: a.category, title: a.pt.title, body: a.pt.body, lang: "pt" };
  return { id: a.id, category: a.category, title: a.title, body: a.body, lang: "en" };
}

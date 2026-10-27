// Bootstraps router, auth state, polling, header/banner/footer, presenter panel.
import { CONFIG } from "../config.js";
import { state } from "./state.js";
import { t } from "./i18n.js";
import { route, current, go } from "./router.js";
import { data, sourceLabel } from "./data/index.js";
import { toast, esc } from "./components/ui.js";
import { syncAuth, authSyncStatus, onAuthSync } from "./authsheet.js";
import { startChat, openChat as openUjet, chatStatus, onChatStatus } from "./websdk.js";
import * as P from "./views/public.js";
import { home } from "./views/home.js";
import { support } from "./views/support.js";
import { tickets, ticket } from "./views/tickets.js";
import { orders, order } from "./views/orders.js";
import { devices, device } from "./views/devices.js";
import { kbList, article } from "./views/kb.js";
import { store, profile, search, notFound } from "./views/misc.js";

const PUBLIC = new Set(["/welcome", "/locations", "/locations/:id", "/login"]);
route("/welcome", P.welcome); route("/locations", P.locations); route("/locations/:id", P.location); route("/login", P.login);
route("/", home);
route("/support/:category", support);
route("/tickets", tickets); route("/tickets/:number", ticket);
route("/orders", orders); route("/orders/:number", order);
route("/devices", devices); route("/devices/:serial", device);
route("/kb", kbList); route("/kb/:id", article);
route("/store", store); route("/profile", profile); route("/search", search);
route("*", notFound);

const $ = id => document.getElementById(id);
const outlet = $("outlet");
let renderSeq = 0, lastView = null, lastRefresh = null;
const hot = {};

/* ---------------- render ---------------- */
async function render({ soft = false } = {}) {
  const r = current();
  if (!state.signedIn && !PUBLIC.has(r.pattern)) { location.replace("#/welcome"); return; }
  if (state.signedIn && r.pattern === "/login") { location.replace("#/"); return; }
  const seq = ++renderSeq;
  let view;
  try { view = (await r.handler({ params: r.params, query: r.query })) || (await notFound()); }
  catch (e) { console.error(e); view = { html: `<div class="panel error">Something went wrong loading this page. ${esc(e.message)}</div>` }; }
  if (seq !== renderSeq) return; // a newer navigation won

  if (soft) {
    // Polling refresh: skip while the user is typing in this view
    if (outlet.contains(document.activeElement) && /input|select|textarea/i.test(document.activeElement.tagName)) return;
    const before = liveMap(outlet);
    const y = window.scrollY;
    outlet.innerHTML = view.html; window.scrollTo(0, y);
    const after = liveMap(outlet);
    for (const k in after) if (k in before && before[k] !== after[k]) { hot[k] = Date.now() + 10000; flash(outlet.querySelector(`[data-live="${CSS.escape(k)}"]`)); }
    // keep the "updated live" highlight on changed values for ~10 s across polls
    for (const k in hot) { if (hot[k] < Date.now()) delete hot[k]; else outlet.querySelector(`[data-live="${CSS.escape(k)}"]`)?.classList.add("changed"); }
  } else {
    for (const k in hot) delete hot[k];
    outlet.innerHTML = view.html;
    window.scrollTo(0, 0);
    $("main").focus({ preventScroll: true });
  }
  document.body.className = view.bodyClass || "";
  view.bind?.(outlet, ctx);
  lastView = view; lastRefresh = new Date();
  shell();
}
const liveMap = root => Object.fromEntries([...root.querySelectorAll("[data-live]")].map(n => [n.dataset.live, n.innerHTML]));
function flash(n) { if (!n) return; n.classList.remove("changed"); void n.offsetWidth; n.classList.add("changed"); }

/* ---------------- header / banner / footer ---------------- */
function shell() {
  const p = state.persona;
  document.documentElement.lang = state.lang === "pt" ? "pt-PT" : "en";
  $("gsearch").hidden = !p;
  $("gsearchInput").placeholder = t("searchPh");
  $("hdrRight").innerHTML = p ? `
    <a class="storechip" href="#/store">${t("storeChip", { id: p.storeId })}</a>
    <nav class="circles" aria-label="Quick links">
      <a href="#/tickets" title="${t("myTickets")}" aria-label="${t("myTickets")}">🎫</a>
      <a href="#/devices" title="${t("devices")}" aria-label="${t("devices")}">📱</a>
      <a href="#/kb" title="${t("kb")}" aria-label="${t("kb")}">📚</a>
    </nav>
    <a class="avatar" href="#/profile" title="${esc(p.name)}">${esc(p.name.split(" ").map(w => w[0]).join(""))}</a>
    <span class="pname">${esc(p.name)}</span>
    <button type="button" class="btn small light" id="signOut">${t("signOut")}</button>` : `
    <nav class="pubnav"><a href="#/welcome">${t("welcome")}</a><a href="#/locations">${t("locations")}</a></nav>
    <a class="btn small primary" href="#/login">${t("signIn")}</a>`;
  $("signOut")?.addEventListener("click", signOut);
  $("footer").innerHTML = `<span class="dsbadge">${t("data")}: ${sourceLabel()}</span> · ${t("lastRefresh")} ${lastRefresh ? lastRefresh.toLocaleTimeString() : "—"}
    · Auth sheet ${esc(sheetLabel(false))} · Chat ${esc(chatStatus().state === "error" ? "error: " + chatStatus().detail : chatStatus().state)}
    <span class="sp"></span><span class="muted">Demo environment · not a Levi Strauss &amp; Co. system</span>`;
}

async function banner() {
  const b = $("banner");
  try {
    if (state.signedIn) {
      const s = await data.getStoreStatus(state.storeId);
      const o = s?.activeOutage;
      b.innerHTML = o ? `<a class="outage" href="#/tickets/${o.number}">⚠ ${t("outage", { num: o.number })}</a>` : "";
    } else {
      const o = await data.getPublicOutage();
      b.innerHTML = o ? `<div class="outage">⚠ ${t("outagePublic", { n: o.stores, region: o.region })}</div>` : "";
    }
  } catch { b.innerHTML = ""; }
}

/* ---------------- auth ---------------- */
async function signIn(personaId) {
  outlet.querySelectorAll(".persona").forEach(b => (b.disabled = true)); // instant sign-in, no spinner
  let res;
  try { res = await data.signIn(personaId); }
  catch (e) {
    toast("Sign-in API unavailable – continuing with mock data", "warn");
    const { mock } = await import("./data/mock.js");
    res = await mock.signIn(personaId);
  }
  const persona = res.persona;
  const [open, ords, stores] = await Promise.all([data.listTickets(persona.storeId, { state: "open" }), data.listOrders(persona.storeId), data.listStores()]);
  const st = stores.find(x => x.id === persona.storeId) || {};
  persona.storeName = st.name; persona.region = st.region;
  state.setSession({ persona, ujetToken: res.ujetToken || null, portalToken: res.portalToken || null, signedCustomData: res.signedCustomData || null,
    openTickets: open.map(x => x.number), openOrders: ords.filter(o => o.stage !== "Delivered").map(o => o.number) });
  if (location.hash === "#/" || location.hash === "") render(); else go("#/");
}
async function signOut() {
  state.setSession(null);          // triggers syncAuth (signed out)
  await syncAuth("sign out");      // make sure it is saved
  if (CONFIG.CHAT.restartOn === "never") { go("#/login"); return; }  // keep the chat open
  location.hash = "#/login";
  location.reload();               // fresh page = fresh guest chat
}
const ctx = { signIn };

/* ---------------- events ---------------- */
document.addEventListener("click", e => {
  const c = e.target.closest("[data-chat]");
  if (c) { e.preventDefault(); openChat(); }
  const dis = e.target.closest('a[aria-disabled="true"]');
  if (dis) { e.preventDefault(); toast("Placeholder link (demo)"); }
});
document.addEventListener("submit", e => {
  if (e.target.id === "gsearch" || e.target.matches("[data-search]")) {
    e.preventDefault();
    const q = e.target.querySelector("input").value.trim();
    if (q) go("#/search?q=" + encodeURIComponent(q));
  }
});
// "Chat with Stitch" buttons open the UJET widget that the Tampermonkey injector adds to the page
function openChat() {
  if (openUjet()) return;
  const w = window.__ujetInjected; // Tampermonkey injector, if used instead
  try { if (w && w.show) { w.show(); return; } } catch {}
  toast("Open the Stitch chat with the button in the bottom-right corner");
}

// Which user the open chat was started for (null = guest). Decides whether a sign-in/switch restarts it:
//   "every_change" restart on any sign-in, sign-out or user switch
//   "auth_change"  restart only between guest and signed in; Amanda <-> Joana keeps the conversation
//   "never"        always keep the conversation (the VA must read the user from the sheet)
let chatUser = state.persona?.id || null;
function shouldRestartChat(prev, next) {
  const mode = CONFIG.CHAT.restartOn || "auth_change";
  if (mode === "never") return false;
  if (mode === "auth_change") return !!prev !== !!next;
  return prev !== next;
}

window.addEventListener("hashchange", () => render());
window.addEventListener("lsco:data-changed", () => { render({ soft: true }); banner(); });
state.onChange(async type => {
  if (type === "session") {
    banner();
    // 1) save the new auth state to the sheet, 2) restart the chat, which reads that same row
    await syncAuth(state.persona ? "signed in " + state.persona.employeeId : "signed out");
    const now = state.persona?.id || null;
    if (shouldRestartChat(chatUser, now)) { chatUser = now; startChat("sign-in"); }
    else console.log("[LSCO chat] keeping the current conversation (CHAT.restartOn = " + CONFIG.CHAT.restartOn + "); the VA reads the new user from the sheet");
  }
  if (type === "datasource") { render(); banner(); }
});

/* ---------------- polling (only what is on screen, paused when hidden) ---------------- */
setInterval(() => { if (!document.hidden && lastView?.poll) render({ soft: true }); }, CONFIG.POLL_MS);
setInterval(() => { if (!document.hidden) banner(); }, CONFIG.BANNER_POLL_MS);
document.addEventListener("visibilitychange", () => { if (!document.hidden && lastView?.poll) render({ soft: true }); });

/* ---------------- presenter panel (Shift+P) ---------------- */
async function presenter() {
  const pnl = $("presenter");
  const personas = await data.listPersonas();
  const mockMode = state.dataSource === "mock";
  pnl.innerHTML = `<div class="pp-h"><b>Presenter</b><span>Shift+P</span></div>
    <div class="pp-r"><span>Persona</span><div>${personas.map(p => `<button data-pp="persona:${p.id}" class="${state.persona?.id === p.id ? "on" : ""}">${esc(p.firstName)}</button>`).join("")}<button data-pp="signout">Sign out</button></div></div>
    <div class="pp-r"><span>Data source</span><div><button data-pp="ds:mock" class="${mockMode ? "on" : ""}">mock</button><button data-pp="ds:api" class="${!mockMode ? "on" : ""}">api</button><button data-pp="refresh">Force refresh</button></div></div>
    ${mockMode ? `<div class="pp-r col"><span>Simulate</span><div class="grid">
      <button data-pp="sim:order">Create iPad order (UC 2a)</button>
      <button data-pp="sim:outage">Start NYC outage (UC 1a)</button>
      <button data-pp="sim:resolve">Resolve outage</button>
      <button data-pp="sim:comment">Add comment to INC0010234 (UC 1b)</button>
      <button data-pp="sim:hold">Put #322 ticket On Hold – Awaiting Caller (UC 3.1)</button>
      <button data-pp="sim:reset">Reset mock data</button></div></div>` : `<div class="pp-r"><span>Simulate</span><div class="muted">mock mode only</div></div>`}
    <div class="pp-r"><span>Auth sheet</span><div class="mono">${sheetLabel()}</div></div>
    <div class="pp-r"><span>Chat</span><div class="mono">${esc(chatLabel())}</div></div>
    <div class="pp-r"><span></span><div><button data-pp="resync">Re-send auth state</button><button data-pp="rechat">Restart chat</button></div></div>`;
}
document.addEventListener("keydown", e => {
  if (e.shiftKey && e.key.toLowerCase() === CONFIG.PRESENTER_MODE_KEY && !/input|textarea|select/i.test(document.activeElement.tagName)) {
    const pnl = $("presenter"); pnl.hidden = !pnl.hidden; if (!pnl.hidden) presenter();
  }
});
$("presenter").addEventListener("click", async e => {
  const b = e.target.closest("[data-pp]"); if (!b) return;
  const [a, v] = b.dataset.pp.split(":");
  const sim = data.simulate;
  if (a === "persona") { await signIn(v); }
  else if (a === "signout") { signOut(); return; }
  else if (a === "ds") { state.setDataSource(v); toast("Data source: " + v); }
  else if (a === "refresh") { await render({ soft: true }); banner(); toast("Refreshed"); }
  else if (a === "sim" && sim) {
    const msg = {
      order: async () => "Created " + (await sim.createIpadOrder("322", "DMPX3221A")),
      outage: async () => (await sim.startOutage(), "NYC outage started"),
      resolve: async () => (await sim.resolveOutage(), "Outage resolved"),
      comment: async () => (await sim.addComment("INC0010234"), "Comment added to INC0010234"),
      hold: async () => (await sim.putOnHold("INC0010276"), "INC0010276 On Hold – Awaiting Caller"),
      reset: async () => (await sim.reset(), "Mock data reset")
    }[v];
    if (msg) toast(await msg());
    // Changes show on the next poll; banner refreshes now
    banner();
  } else if (a === "rechat") {
    await syncAuth("manual"); chatUser = state.persona?.id || null; await startChat("manual"); toast("Chat: " + chatLabel());
  } else if (a === "resync") {
    await syncAuth("manual"); const st = authSyncStatus(); toast(st.ok ? "Auth state saved to the sheet" : "Sheet: " + (st.error || "not saved"), st.ok ? "" : "warn");
  }
  presenter();
});

/* ---------------- auth sheet status (footer + presenter) ---------------- */
function sheetLabel(withUser = true) {
  const st = authSyncStatus();
  if (!st.at) return "…";
  const who = st.row?.auth_status ? `${st.row.first_name} ${st.row.last_name}` : "no user";
  return (st.ok ? "✓ saved" : st.ok === false ? "✗ " + st.error : "– " + st.error) + (withUser ? " · " + who : "") + " · " + st.at.toLocaleTimeString();
}
function chatLabel() {
  const c = chatStatus();
  return { ready: "✓ ", starting: "… ", error: "✗ ", off: "– " }[c.state] + (c.detail || c.state);
}
onAuthSync(() => { shell(); if (!$("presenter").hidden) presenter(); });
onChatStatus(() => { shell(); if (!$("presenter").hidden) presenter(); });

/* ---------------- boot ---------------- */
render();
banner();
// The sheet always matches what the portal shows (also after a refresh), then the chat starts from that row
syncAuth("page load").then(() => startChat("page load"));
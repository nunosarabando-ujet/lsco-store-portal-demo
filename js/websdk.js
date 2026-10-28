// Embedded UJET Web SDK v3 chat (svcnow tenant). Replaces the Tampermonkey injector for this portal.
//
// Flow: the portal saves the auth state to the Google Sheet (authsheet.js), then asks the same Apps Script for
// ?action=widget. The script reads the Auth row + the Tenant tab and returns the tenant host, company key, menu key,
// a signed login token and signed custom data. The company secret never reaches the browser.
// On every sign-in / sign-out / persona switch the chat is closed and started again with the new user.
import { CONFIG } from "../config.js";
import { state } from "./state.js";

const C = () => CONFIG.AUTH_SHEET;
const MOUNT_ID = "ujet-widget";
let ccaas = null, sdkLoaded = null, wasOpen = false, startSeq = 0;
let status = { state: "off", detail: "" };
const listeners = new Set();
const setStatus = (s, detail = "") => { status = { state: s, detail, at: new Date() }; listeners.forEach(f => f(status)); };

function sessionId() {
  let id = null;
  try { id = sessionStorage.getItem("lsco.portalSessionId"); } catch {}
  if (!id) { id = "ps-" + Math.random().toString(36).slice(2, 10); try { sessionStorage.setItem("lsco.portalSessionId", id); } catch {} }
  return id;
}

async function fetchWidget() {
  // POST with text/plain, exactly like the auth-sheet write (no CORS preflight)
  let r;
  try {
    r = await fetch(C().url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "widget", token: C().token, key: C().key, sid: sessionId() }) });
  } catch (e) {
    throw new Error("Apps Script not reachable (" + e.message + "). Check the deployment is the latest version with access 'Anyone'");
  }
  const text = await r.text();
  let j;
  try { j = JSON.parse(text); }
  catch { throw new Error("Apps Script returned a page, not JSON (redeploy as a New version?): " + text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120)); }
  if (!j.ok) throw new Error(j.error || "widget config failed");
  return j;
}

function loadSdk(host) {
  if (window.UJET) return Promise.resolve();
  if (!sdkLoaded) sdkLoaded = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = `https://${host}/web-sdk/v3/widget.js`;
    s.onload = res;
    s.onerror = () => { sdkLoaded = null; rej(new Error("Could not load the UJET widget from " + host)); };
    document.head.appendChild(s);
  });
  return sdkLoaded;
}

// One hex colour -> the widget's accent scale + launcher and button colours (same as the UJET demo kit injector)
function mixHex(hex, other, t) {
  const a = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)), b = [1, 3, 5].map(i => parseInt(other.slice(i, i + 2), 16));
  return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("");
}
function brandVars(color) {
  if (!/^#[0-9a-fA-F]{6}$/.test(color || "")) return {};
  const v = {};
  [0.97, 0.94, 0.88, 0.8, 0.7, 0.58, 0.45, 0.28].forEach((t, i) => { v["--accent-" + (i + 1)] = mixHex(color, "#ffffff", t); });
  v["--accent-9"] = color.toLowerCase();
  v["--accent-10"] = mixHex(color, "#000000", 0.08);
  v["--accent-11"] = mixHex(color, "#000000", 0.25);
  v["--accent-12"] = mixHex(color, "#000000", 0.55);
  v["--launcher-background-color"] = color.toLowerCase();
  v["--launcher-border-color"] = color.toLowerCase();
  v["--primary-button-default-background"] = color.toLowerCase();
  v["--primary-button-hover-background"] = v["--accent-10"];
  return v;
}

// Fresh mount node every time (a new node drops the old widget's shadow DOM)
function freshMount() {
  const old = document.getElementById(MOUNT_ID);
  const el = document.createElement("div");
  el.id = MOUNT_ID;
  el.style.cssText = "position:fixed;right:0;bottom:0;z-index:2147483000;isolation:isolate;";
  Object.entries(brandVars(CONFIG.CHAT.accent)).forEach(([k, v]) => el.style.setProperty(k, v));
  old ? old.replaceWith(el) : document.body.appendChild(el);
}

export async function startChat(reason = "") {
  if (!CONFIG.CHAT.enabled) { setStatus("off", "CHAT.enabled is false"); return; }
  if (!C().url || C().url.includes("REPLACE")) { setStatus("error", "sheet URL not configured"); return; }
  if (document.getElementById("ujet-injected-widget")) {
    console.warn("[LSCO chat] The Tampermonkey injector is also adding a chat here. Turn it off for this site (Option+Shift+U > Turn off here).");
  }
  const seq = ++startSeq;
  setStatus("starting", reason);
  try {
    const w = await fetchWidget();
    if (seq !== startSeq) return; // a newer sign-in/out won
    await loadSdk(w.host);
    if (ccaas) { try { ccaas.destroy && ccaas.destroy(); } catch (e) { console.warn("[LSCO chat] destroy failed", e); } ccaas = null; }
    freshMount();
    let first = w.userToken;
    // VERIFY against the tenant's Web SDK v3 snippet if anything misbehaves (same options as the demo kit injector)
    ccaas = new window.UJET({
      companyId: w.companyKey,
      host: "https://" + w.host,
      authenticate: async () => {
        if (first) { const t = first; first = null; return { token: t }; }
        return { token: (await fetchWidget()).userToken }; // token refresh (10 min expiry)
      }
    });
    const conf = { customData: w.customData };
    if (w.menuKey) conf.menuKey = w.menuKey;
    if (CONFIG.CHAT.logo) conf.logo = new URL(CONFIG.CHAT.logo, location.href).href; // "assets/x.png" works too
    ccaas.config(conf);
    ccaas.mount("#" + MOUNT_ID);
    window.__ujetPortal = ccaas;
    const reopen = wasOpen && reason !== "page load";
    try {
      ccaas.on("visible", v => { wasOpen = !!v; });
      ccaas.on("ready", () => { if (reopen) { try { ccaas.show && ccaas.show(); } catch {} } });
    } catch { /* older SDK */ }
    const who = w.auth.auth_status ? `${w.auth.first_name} ${w.auth.last_name}` : "guest";
    setStatus("ready", `${w.host} · ${who}`);
    console.log("[LSCO chat] UJET chat started as", who, w.menuKey ? "(menu " + w.menuKey + ")" : "");
  } catch (e) {
    console.error("[LSCO chat]", e);
    setStatus("error", e.message);
  }
}

export function openChat() {
  try { if (ccaas && ccaas.show) { ccaas.show(); return true; } } catch {}
  return false;
}
export const chatStatus = () => status;
export const onChatStatus = fn => (listeners.add(fn), () => listeners.delete(fn));

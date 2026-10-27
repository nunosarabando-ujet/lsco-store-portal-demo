// Public pages (no sign-in): Welcome, Store Locations, store detail, simulated Entra ID login.
import { data } from "../data/index.js";
import { state } from "../state.js";
import { t } from "../i18n.js";
import { esc, crumbs, table, kv, chatButton } from "../components/ui.js";

export async function welcome() {
  return { html: `
    <section class="hero">
      <h1>${t("welcomeTitle")}</h1>
      <p>${t("welcomeSub")}</p>
      <div class="row"><a class="btn primary" href="#/login">${t("signIn")}</a><a class="btn light" href="#/locations">${t("findStore")}</a></div>
    </section>
    <section class="tiles2">
      <a class="stile" href="#/locations"><span class="sdot"></span><span><b>${t("locations")}</b><small>Addresses, phone numbers and opening hours</small></span><span class="chev">›</span></a>
      <button type="button" class="stile" data-chat=""><span class="sdot"></span><span><b>Ask Stitch</b><small>No sign-in needed for store information</small></span><span class="chev">›</span></button>
      <a class="stile" href="#/login"><span class="sdot"></span><span><b>${t("signIn")}</b><small>Tickets, hardware orders and devices for your store</small></span><span class="chev">›</span></a>
    </section>` };
}

export async function locations() {
  const stores = await data.listStores();
  return { html: crumbs([[t("welcome"), "#/welcome"], [t("locations")]]) + `<h1 class="pg">${t("locations")}</h1>` +
    table(["#", t("name"), t("address"), t("hours")], stores.map(s =>
      `<tr><td><a href="#/locations/${s.id}">#${s.id}</a></td><td><a href="#/locations/${s.id}">${esc(s.name)}</a></td><td>${esc(s.address)}</td><td>${esc(s.hours)}</td></tr>`)) };
}

export async function location({ params }) {
  const s = (await data.listStores()).find(x => x.id === params.id);
  if (!s) return null;
  return { html: crumbs([[t("welcome"), "#/welcome"], [t("locations"), "#/locations"], ["#" + s.id]]) +
    `<h1 class="pg">#${s.id} ${esc(s.name)}</h1><div class="panel">` +
    kv([[t("address"), esc(s.address)], [t("phone"), esc(s.phone)], [t("hours"), esc(s.hours)], [t("region"), esc(s.region)]]) +
    `</div><div class="row">${chatButton("Opening hours for #" + s.id)}</div>` };
}

export async function login() {
  const personas = await data.listPersonas();
  return { html: `
    <div class="login-wrap"><div class="login-card">
      <div class="ms"><span></span><span></span><span></span><span></span><b>Microsoft</b></div>
      <h1 class="ms-h">${t("chooseAccount")}</h1>
      <p class="muted small">${t("signInSub")} · LS&amp;Co.</p>
      <div class="personas">${personas.map(p => `
        <button type="button" class="persona" data-persona="${p.id}">
          <span class="pav">${esc(p.name.split(" ").map(w => w[0]).join(""))}</span>
          <span><b>${esc(p.name)}</b><small>${esc(p.email)}</small><small>${esc(p.role)} · Store #${p.storeId} · ${p.language.toUpperCase()}</small></span>
        </button>`).join("")}</div>
      <div class="signing" id="signing" hidden><span class="spin" aria-hidden="true"></span>${t("signingIn")}</div>
      <p class="tiny muted">Demo only. No credentials are collected.</p>
    </div></div>`,
    bind(root, ctx) {
      root.querySelectorAll("[data-persona]").forEach(b => b.addEventListener("click", () => ctx.signIn(b.dataset.persona)));
    }
  };
}

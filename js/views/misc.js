import { data } from "../data/index.js";
import { state } from "../state.js";
import { t } from "../i18n.js";
import { esc, crumbs, pill, kv, fmtDate, table } from "../components/ui.js";

export async function store() {
  const s = await data.getStoreStatus(state.storeId);
  if (!s) return null;
  const st = s.store;
  return {
    poll: true,
    html: crumbs([[t("home"), "#/"], [t("store")]]) + `<h1 class="pg">#${st.id} ${esc(st.name)}</h1>
    ${s.activeOutage ? `<div class="panel alert">⚠ ${t("activeOutage")}: <a href="#/tickets/${s.activeOutage.number}">${s.activeOutage.number}</a> · ${esc(s.activeOutage.shortDescription)}</div>` : ""}
    <h2 class="sec">${t("health")} · <a href="#/devices">${t("devices")} ›</a></h2>
    <div class="health" data-live="health">${s.health.map(h => `<div class="htile ${h.status.toLowerCase()}"><small>${esc(h.component)}</small><b>${h.status}</b></div>`).join("")}</div>
    <div class="panel">${kv([[t("address"), esc(st.address)], [t("phone"), esc(st.phone)], [t("hours"), esc(st.hours)],
      ["Manager", esc(st.manager)], [t("region"), `${esc(st.region)} · ${esc(st.circuit)}`], ["LTE backup", st.lteBackup ? "Yes" : "No"]])}</div>
    <h2 class="sec">${t("affected")}</h2>
    ${s.affectedStores.length ? `<ul class="list">${s.affectedStores.map(a => `<li>#${a.id} ${esc(a.name)}</li>`).join("")}</ul>` : `<p class="muted">${t("none")}</p>`}`
  };
}

export async function profile() {
  const p = state.persona;
  return { html: crumbs([[t("home"), "#/"], [t("profile")]]) + `<h1 class="pg">${esc(p.name)}</h1><div class="panel">${kv([
    [t("role"), esc(p.role)], [t("employeeId"), esc(p.employeeId)], [t("email"), esc(p.email)], [t("storeL"), `<a href="#/store">#${p.storeId}</a>`],
    [t("lang"), p.language === "pt" ? "Português (PT)" : "English"], [t("mobile"), esc(p.mobileMasked)],
    [t("method"), "Microsoft Entra ID (simulated)"], ["Signed in", fmtDate(state.session.signedInAt)]])}</div>` };
}

export async function search({ query }) {
  const q = query.q || "";
  const r = q ? await data.search(state.storeId, q) : { tickets: [], orders: [], devices: [], kb: [] };
  const sec = (title, rows) => rows.length ? `<h2 class="sec">${title} (${rows.length})</h2><ul class="list">${rows.join("")}</ul>` : "";
  const html = sec(t("myTickets"), r.tickets.map(x => `<li><a href="#/tickets/${x.number}">${x.number}</a> ${pill(x.state)} ${esc(x.shortDescription)}</li>`)) +
    sec(t("orders"), r.orders.map(x => `<li><a href="#/orders/${x.number}">${x.number}</a> · ${esc(x.item)}</li>`)) +
    sec(t("devices"), r.devices.map(x => `<li><a href="#/devices/${encodeURIComponent(x.serial)}">${esc(x.name)}</a> · <span class="mono">${esc(x.serial)}</span></li>`)) +
    sec(t("kb"), r.kb.map(x => `<li><a href="#/kb/${x.id}">${esc(x.title)}</a></li>`));
  return { html: crumbs([[t("home"), "#/"], [t("searchRes")]]) + `<h1 class="pg">${t("searchRes")}: “${esc(q)}”</h1>` + (html || `<p class="muted">${t("noResults")}</p>`) };
}

export async function notFound() {
  return { html: `<div class="nf"><h1 class="pg">${t("notFound")}</h1><p><a class="btn primary" href="${state.signedIn ? "#/" : "#/welcome"}">${t("backHome")}</a></p></div>` };
}

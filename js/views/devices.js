import { data } from "../data/index.js";
import { state } from "../state.js";
import { t } from "../i18n.js";
import { esc, crumbs, table, pill, fmtDate, kv, chatButton } from "../components/ui.js";
import { go } from "../router.js";

const TYPES = { ipad: "iPad", pos: "POS", gateway: "Gateway", switch: "Switch", ap: "Wi-Fi AP" };

export async function devices({ query }) {
  const type = query.type || "";
  const list = await data.listDevices(state.storeId, { type });
  return {
    poll: true,
    html: crumbs([[t("home"), "#/"], [t("devices")]]) + `<h1 class="pg">${t("devices")} · Store #${state.storeId}</h1>
    <div class="filters"><label>${t("type")} <select id="dtype"><option value="">${t("allTypes")}</option>
      ${Object.entries(TYPES).map(([k, v]) => `<option value="${k}"${k === type ? " selected" : ""}>${v}</option>`).join("")}</select></label></div>` +
      table([t("name"), t("type"), t("serial"), t("status"), t("location")], list.map(d => `<tr>
        <td><a href="#/devices/${encodeURIComponent(d.serial)}">${esc(d.name)}</a></td><td>${TYPES[d.type] || d.type}</td>
        <td class="mono">${esc(d.serial)}</td><td data-live="s-${d.serial}">${pill(d.status)}</td><td>${esc(d.location)}</td></tr>`)),
    bind(root) { root.querySelector("#dtype").addEventListener("change", e => go("#/devices" + (e.target.value ? "?type=" + e.target.value : ""))); }
  };
}

export async function device({ params }) {
  const d = await data.getDevice(params.serial);
  if (!d) return null;
  const limit = d.type === "ipad" && d.replacementsLast90d >= 1;
  return {
    poll: true,
    html: crumbs([[t("home"), "#/"], [t("devices"), "#/devices"], [d.name]]) + `
    <div class="rechead"><h1 class="pg">${esc(d.name)}</h1><span data-live="st">${pill(d.status)}</span></div>
    <div class="panel">${kv([
      [t("type"), TYPES[d.type] || d.type], ["Model", esc(d.model)], [t("serial"), `<span class="mono">${esc(d.serial)}</span>`],
      [t("location"), esc(d.location)], [t("storeL"), `#${esc(d.storeId)}`], [t("warranty"), fmtDate(d.warrantyEnd, false)],
      [t("openTickets"), d.openTickets.length ? d.openTickets.map(n => `<a href="#/tickets/${n}">${n}</a>`).join(", ") : t("none")],
      d.type === "ipad" ? [t("repl90"), `<span data-live="r90">${d.replacementsLast90d}</span> / 1 ${limit ? `<span class="pill warn">Limit reached</span>` : ""}<br><span class="muted small">${t("replPolicy")} · <a href="#/kb/KB0004">KB0004</a></span>`] : null
    ])}</div>
    ${d.type === "ipad" ? `<div class="row">${chatButton(`The screen on ${d.name} is smashed. I need a replacement.`, "Request a replacement with Stitch")}</div>` : ""}`
  };
}

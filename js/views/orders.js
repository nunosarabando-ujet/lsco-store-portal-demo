import { data, currentSource } from "../data/index.js";
import { state } from "../state.js";
import { t } from "../i18n.js";
import { esc, crumbs, table, pill, fmtDate, kv, stepper, snowButton, chatButton } from "../components/ui.js";

const eta = v => (/^\d{4}-/.test(v || "") ? fmtDate(v, false) : esc(v || "—"));

export async function orders() {
  const list = await data.listOrders(state.storeId);
  return {
    poll: true,
    html: crumbs([[t("home"), "#/"], [t("orders")]]) + `<h1 class="pg">${t("orders")} · Store #${state.storeId}</h1>` +
      table([t("number"), t("item"), t("serial"), t("stage"), t("eta"), t("opened")], list.map(o => `<tr>
        <td><a href="#/orders/${o.number}">${o.number}</a></td><td>${esc(o.item)}</td>
        <td>${o.serial ? `<a href="#/devices/${o.serial}" class="mono">${o.serial}</a>` : "—"}</td>
        <td>${pill(o.stage)}</td><td>${eta(o.eta)}</td><td>${fmtDate(o.openedAt)}</td></tr>`)) +
      `<div class="row">${chatButton("The screen on one of our iPads is smashed. I need a replacement.", "Order a replacement iPad with Stitch")}</div>`
  };
}

export async function order({ params }) {
  const o = await data.getOrder(params.number);
  if (!o) return null;
  return {
    poll: true,
    html: crumbs([[t("home"), "#/"], [t("orders"), "#/orders"], [o.number]]) + `
    <div class="rechead"><h1 class="pg">${o.number}</h1><span data-live="stage">${pill(o.stage)}</span><span class="sp"></span>${snowButton("sc_req_item", o.number, currentSource())}</div>
    <p class="lead">${esc(o.item)}</p>
    <div data-live="stepper">${stepper(o.stage)}</div>
    <div class="panel">${kv([
      [t("serial"), o.serial ? `<a class="mono" href="#/devices/${o.serial}">${o.serial}</a>` : "—"],
      [t("eta"), eta(o.eta)], [t("shipTo"), esc(o.shipTo)], [t("tracking"), esc(o.tracking || "—")],
      [t("returnLabel"), o.serial ? `<a href="#" aria-disabled="true" class="ext">${t("download")}</a>` : "—"],
      [t("opened"), fmtDate(o.openedAt)]
    ])}</div>
    <h2 class="sec">History</h2><ul class="list">${(o.history || []).slice().reverse().map(h => `<li>${pill(h.stage)} ${fmtDate(h.at)}</li>`).join("")}</ul>`
  };
}

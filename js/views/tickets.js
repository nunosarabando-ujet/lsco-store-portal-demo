import { data, currentSource } from "../data/index.js";
import { state } from "../state.js";
import { t } from "../i18n.js";
import { esc, crumbs, table, pill, fmtDate, kv, timeline, snowButton, chatButton } from "../components/ui.js";
import { go } from "../router.js";

export async function tickets({ query }) {
  const f = { state: query.state || "open", type: query.type || "", q: query.q || "" };
  const list = await data.listTickets(state.storeId, f);
  const opt = (v, cur, label) => `<option value="${v}"${v === cur ? " selected" : ""}>${label}</option>`;
  return {
    poll: true,
    html: crumbs([[t("home"), "#/"], [t("myTickets")]]) + `<h1 class="pg">${t("myTickets")} · Store #${state.storeId}</h1>
    <form class="filters" id="tfilters">
      <label>${t("state")} <select name="state">${opt("open", f.state, t("allOpen"))}${opt("on_hold", f.state, t("onHold"))}${opt("resolved", f.state, t("resolved"))}</select></label>
      <label>${t("type")} <select name="type">${opt("", f.type, t("allTypes"))}${opt("tech", f.type, t("tech"))}${opt("ops", f.type, t("ops"))}${opt("question", f.type, t("question"))}</select></label>
      <label class="grow"><span class="sr">${t("filterText")}</span><input name="q" type="search" value="${esc(f.q)}" placeholder="${t("filterText")}"></label>
    </form>` +
      table([t("number"), t("shortDesc"), t("state"), t("priority"), t("category"), t("updated")], list.map(x => `<tr data-live-row="${x.number}">
        <td><a href="#/tickets/${x.number}">${x.number}</a></td><td>${esc(x.shortDescription)}</td><td>${pill(x.state)}</td>
        <td>${esc(x.priority)}</td><td>${esc(x.category)}</td><td data-live="u-${x.number}">${fmtDate(x.updatedAt)}</td></tr>`)),
    bind(root) {
      const form = root.querySelector("#tfilters");
      const apply = () => { const p = new URLSearchParams(new FormData(form)); for (const [k, v] of [...p]) if (!v) p.delete(k); go("#/tickets?" + p.toString()); };
      form.querySelectorAll("select").forEach(s => s.addEventListener("change", apply));
      form.addEventListener("submit", e => { e.preventDefault(); apply(); });
      form.querySelector("input").addEventListener("change", apply);
    }
  };
}

export async function ticket({ params }) {
  const x = await data.getTicket(params.number);
  if (!x) return null;
  const parent = x.parent ? await data.getTicket(x.parent) : null;
  return {
    poll: true,
    html: crumbs([[t("home"), "#/"], [t("myTickets"), "#/tickets"], [x.number]]) + `
    <div class="rechead"><h1 class="pg">${x.number}</h1><span data-live="state">${pill(x.state)}</span>
      ${x.majorIncident ? `<span class="pill bad">Major incident</span>` : ""}<span class="sp"></span>${snowButton("incident", x.number, currentSource())}</div>
    <p class="lead">${esc(x.shortDescription)}</p>
    ${x.description ? `<p class="muted">${esc(x.description)}</p>` : ""}
    <div class="panel">${kv([
      [t("opened"), fmtDate(x.openedAt)], [t("updated"), `<span data-live="upd">${fmtDate(x.updatedAt)}</span>`],
      [t("priority"), esc(x.priority)], [t("category"), esc(x.category)], [t("assignment"), esc(x.assignmentGroup)],
      [t("ci"), x.ci ? `<a href="#/devices/${encodeURIComponent(x.ci)}">${esc(x.ci)}</a>` : "—"], [t("caller"), esc(x.caller)],
      [t("storeL"), `<a href="#/store">#${esc(x.storeId)}</a>`],
      x.holdReason ? [t("holdReason"), esc(x.holdReason)] : null,
      x.parent ? [t("parent"), `<a href="#/tickets/${x.parent}">${x.parent}</a>${parent ? " · " + esc(parent.shortDescription) : ""}`] : null
    ])}</div>
    ${x.children?.length ? `<h2 class="sec">${t("children")}</h2><ul class="list">${x.children.map(c => `<li><a href="#/tickets/${c}">${c}</a></li>`).join("")}</ul>` : ""}
    <h2 class="sec">${t("timeline")}</h2><div data-live="tl">${timeline(x.timeline)}</div>
    <div class="row">${chatButton(`What is the status of ${x.number}?`, t("askTicket"))}</div>`
  };
}

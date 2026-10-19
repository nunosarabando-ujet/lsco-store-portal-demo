import { data } from "../data/index.js";
import { state } from "../state.js";
import { t } from "../i18n.js";
import { esc, crumbs, chatButton, table } from "../components/ui.js";

export async function support({ params }) {
  const cats = await data.listCategories();
  const c = cats.find(x => x.key === params.category);
  if (!c) return null;
  const T = state.lang === "pt" && c.pt ? c.pt : c;
  const kb = c.kbCategories.length ? (await data.listKb({ lang: state.lang })).filter(a => c.kbCategories.includes(a.category)) : [];
  let extra = "";
  if (c.key === "fixtures") {
    const fx = await data.listFixtures();
    extra = `<h2 class="sec">${t("fixtures")}</h2><p class="muted">${t("alloc")}: <b>$3,000</b> · Holiday windows campaign</p>` +
      table(["SKU", t("item"), "Fits", "Cost", "Lead time"], fx.map(f =>
        `<tr><td class="mono">${f.sku}</td><td>${esc(f.name)}</td><td>${esc(f.fits)}</td><td>${f.cost ? "$" + f.cost.toLocaleString() : "Free (warranty)"}</td><td>${esc(f.lead)}</td></tr>`)) +
      `<div class="row">${chatButton("What do I need for the Holiday windows?")}${chatButton("A mannequin arm is cracked", "Report a damaged mannequin")}</div>`;
  }
  return { html: crumbs([[t("home"), "#/"], [T.title]]) + `
    <div class="pghead"><span class="sdot big ${c.style}"></span><div><h1 class="pg">${esc(T.title)}</h1><p class="muted">${esc(c.description)}</p></div></div>
    ${c.it ? "" : `<div class="panel steer"><p>${t("notIt", { team: `<b>${esc(c.owningTeam)}</b>` })}</p>
      <p class="small">${t("owningTeam")}: <b>${esc(c.owningTeam)}</b> · <a href="${c.externalLink || "#"}" aria-disabled="true" class="ext">${t("externalPortal", { team: esc(c.owningTeam) })} ↗</a></p></div>`}
    <h2 class="sec">${t("commonRequests")}</h2>
    <div class="reqs">${c.requestTypes.map(r => `<button type="button" class="req" data-chat="${esc(r)}">${esc(r)}<span class="chev">›</span></button>`).join("")}</div>
    <div class="row">${chatButton(c.chatPrompt)}</div>
    ${kb.length ? `<h2 class="sec">${t("relatedKb")}</h2><ul class="list">${kb.map(a => `<li><a href="#/kb/${a.id}">${esc(a.title)}</a> <span class="muted small">${a.id}</span></li>`).join("")}</ul>` : ""}
    ${extra}` };
}

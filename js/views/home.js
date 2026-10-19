import { data } from "../data/index.js";
import { state } from "../state.js";
import { t } from "../i18n.js";
import { esc, counter } from "../components/ui.js";

export async function home() {
  const p = state.persona;
  const [cats, s] = await Promise.all([data.listCategories(), data.getSummary(p.storeId)]);
  const title = c => (state.lang === "pt" && c.pt ? c.pt : c);
  return {
    bodyClass: "route-home",
    poll: true,
    html: `
    <section class="home">
      <p class="hello">${t("hello", { name: esc(p.name) })}</p>
      <h1 class="what">${t("whatSupport")}</h1>
      <form class="hsearch" data-search><label class="sr" for="hsearch">${t("search")}</label>
        <input id="hsearch" type="search" placeholder="${t("search")}" autocomplete="off"></form>
      <div class="tiles2">${cats.map(c => `
        <a class="stile ${c.style}" href="#/support/${c.key}">
          <span class="sdot"></span><span><b>${esc(title(c).title)}</b><small>${esc(title(c).subtitle)}</small></span><span class="chev">›</span>
        </a>`).join("")}</div>
      <h2 class="oi">${t("openItems", { id: p.storeId })}</h2>
      <div class="counters">
        ${counter(t("cTech"), s.techOpen, "#/tickets?state=open&type=tech", "techOpen")}
        ${counter(t("cOps"), s.opsOpen, "#/tickets?state=open&type=ops", "opsOpen")}
        ${counter(t("cQ"), s.questions, "#/tickets?state=open&type=question", "questions")}
        ${counter(t("cHw"), s.hardwareOpen, "#/orders", "hardwareOpen")}
      </div>
    </section>`
  };
}

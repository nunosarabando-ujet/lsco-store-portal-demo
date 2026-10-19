import { data } from "../data/index.js";
import { state } from "../state.js";
import { t } from "../i18n.js";
import { esc, crumbs, md } from "../components/ui.js";
import { go } from "../router.js";

const CATS = ["Network", "POS", "Payments", "Hardware", "Login", "Facilities"];

export async function kbList({ query }) {
  const f = { q: query.q || "", category: query.category || "", lang: state.lang };
  const list = await data.listKb(f);
  return {
    html: crumbs([[t("home"), "#/"], [t("kb")]]) + `<h1 class="pg">${t("kb")}</h1>
    <form class="filters" id="kbf">
      <label>${t("category")} <select name="category"><option value="">${t("allTypes")}</option>${CATS.map(c => `<option${c === f.category ? " selected" : ""}>${c}</option>`).join("")}</select></label>
      <label class="grow"><span class="sr">${t("search")}</span><input name="q" type="search" value="${esc(f.q)}" placeholder="${t("filterText")}"></label>
    </form>
    <div class="kbgrid">${list.length ? list.map(a => `<a class="kbcard" href="#/kb/${a.id}"><small>${esc(a.category)} · ${a.id}${a.lang === "pt" ? " · PT" : ""}</small><b>${esc(a.title)}</b></a>`).join("") : `<p class="muted">${t("noResults")}</p>`}</div>`,
    bind(root) {
      const form = root.querySelector("#kbf");
      const apply = () => { const p = new URLSearchParams(new FormData(form)); for (const [k, v] of [...p]) if (!v) p.delete(k); go("#/kb" + (p.toString() ? "?" + p : "")); };
      form.addEventListener("change", apply); form.addEventListener("submit", e => { e.preventDefault(); apply(); });
    }
  };
}

export async function article({ params }) {
  const a = await data.getKb(params.id, state.lang);
  if (!a) return null;
  return { html: crumbs([[t("home"), "#/"], [t("kb"), "#/kb"], [a.id]]) +
    `<article class="article"><p class="muted small">${esc(a.category)} · ${a.id}${a.lang === "pt" ? " · Português" : ""}</p><h1 class="pg">${esc(a.title)}</h1>${md(a.body)}</article>` };
}

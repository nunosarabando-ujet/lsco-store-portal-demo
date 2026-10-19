// Shared UI components: each returns an HTML string.
import { CONFIG } from "../../config.js";
import { t } from "../i18n.js";
import { state } from "../state.js";

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function fmtDate(iso, withTime = true) {
  if (!iso) return "—";
  const d = new Date(iso); if (isNaN(d)) return esc(iso);
  const loc = state.lang === "pt" ? "pt-PT" : "en-GB";
  return d.toLocaleString(loc, withTime ? { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "short", year: "numeric" });
}

export function pill(s) {
  const v = String(s || "");
  const cls = /resolved|closed|delivered|^up$/i.test(v) ? "ok"
    : /hold|awaiting|new|requested|degraded/i.test(v) ? "warn"
    : /down|critical|cancel/i.test(v) ? "bad" : "info";
  return `<span class="pill ${cls}">${esc(v)}</span>`;
}

export function crumbs(items) {
  return `<nav class="crumbs" aria-label="Breadcrumb">${items.map((c, i) =>
    i < items.length - 1 ? `<a href="${c[1]}">${esc(c[0])}</a><span aria-hidden="true"> › </span>` : `<span aria-current="page">${esc(c[0])}</span>`).join("")}</nav>`;
}

export function table(cols, rows, empty) {
  return `<div class="tbl"><table><thead><tr>${cols.map(c => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead>
    <tbody>${rows.length ? rows.join("") : `<tr><td colspan="${cols.length}" class="empty">${esc(empty || t("nothing"))}</td></tr>`}</tbody></table></div>`;
}

export function counter(label, value, href, key) {
  return `<a class="counter" href="${href}" data-live="${key}"><span class="cv">${value}</span><span class="cl">${esc(label)}</span>
    <span class="live-note">● ${t("updatedLive")}</span></a>`;
}

export function timeline(items) {
  if (!items?.length) return `<p class="muted">${t("nothing")}</p>`;
  return `<ol class="timeline">${items.map(i => `<li class="${i.kind === "work_note" ? "wn" : "cm"}">
    <div class="tl-meta"><b>${esc(i.author)}</b> · ${fmtDate(i.at)}${i.kind === "work_note" ? ` <span class="pill info">${t("internal")}</span>` : ""}</div>
    <div class="tl-text">${esc(i.text)}</div></li>`).join("")}</ol>`;
}

export const STAGES = ["Requested", "Approved", "Fulfillment", "Shipped", "Delivered"];
export function stepper(stage) {
  const idx = STAGES.indexOf(stage);
  return `<ol class="stepper">${STAGES.map((s, i) => `<li class="${i < idx ? "done" : i === idx ? "now" : ""}"><span class="dot"></span>${s}</li>`).join("")}</ol>`;
}

export function snowButton(table, number, source) {
  if (!CONFIG.SHOW_SNOW_LINKS || !number) return "";
  if (source !== "servicenow") return `<span class="chip">${t("mockRecord")}</span>`;
  const url = `${CONFIG.SNOW_INSTANCE_URL}/${table}.do?sysparm_query=number=${encodeURIComponent(number)}`;
  return `<a class="btn ghost" href="${url}" target="_blank" rel="noopener">${t("openSnow")} ↗</a>`;
}

export function chatButton(text, label) {
  return `<button type="button" class="btn" data-chat="${esc(text)}">💬 ${esc(label || t("chatAbout"))}</button>`;
}

export function kv(pairs) {
  return `<dl class="kv">${pairs.filter(Boolean).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v ?? "—"}</dd>`).join("")}</dl>`;
}

export function errorState(msg) { return `<div class="panel error">${esc(msg)}</div>`; }

// markdown-lite: headings, ordered/unordered lists, bold, inline code, paragraphs
export function md(src) {
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`(.+?)`/g, "<code>$1</code>");
  const out = []; let list = null;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const line of String(src || "").split("\n")) {
    let m;
    if ((m = line.match(/^(#{1,3})\s+(.*)/))) { close(); const l = m[1].length + 1; out.push(`<h${l}>${inline(m[2])}</h${l}>`); }
    else if ((m = line.match(/^\d+\.\s+(.*)/))) { if (list !== "ol") { close(); out.push("<ol>"); list = "ol"; } out.push(`<li>${inline(m[1])}</li>`); }
    else if ((m = line.match(/^[-*]\s+(.*)/))) { if (list !== "ul") { close(); out.push("<ul>"); list = "ul"; } out.push(`<li>${inline(m[1])}</li>`); }
    else if (!line.trim()) close();
    else { close(); out.push(`<p>${inline(line)}</p>`); }
  }
  close();
  return out.join("");
}

export function toast(msg, kind = "") {
  const box = document.getElementById("toasts"); if (!box) return;
  const n = document.createElement("div"); n.className = "toast " + kind; n.textContent = msg; box.appendChild(n);
  setTimeout(() => n.remove(), 3500);
}

// Tiny hash router: "#/tickets/:number" params AND query strings inside the hash ("#/tickets?state=open&type=tech").
const routes = [];
let notFound = null;

export function route(pattern, handler, opts = {}) {
  if (pattern === "*") { notFound = { handler, opts }; return; }
  const keys = [];
  const re = new RegExp("^" + pattern.replace(/\/:([\w]+)/g, (_, k) => { keys.push(k); return "/([^/?#]+)"; }) + "/?$");
  routes.push({ re, keys, handler, opts, pattern });
}

export function current() {
  const raw = location.hash.replace(/^#/, "") || "/";
  const [path, qs] = raw.split("?");
  const query = Object.fromEntries(new URLSearchParams(qs || ""));
  for (const r of routes) {
    const m = path.match(r.re);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      return { ...r, params, query, path };
    }
  }
  return { ...notFound, params: {}, query, path, pattern: "*" };
}

export function go(hash) { if (location.hash !== hash) location.hash = hash; }
export function routePatterns() { return routes.map(r => r.pattern); }

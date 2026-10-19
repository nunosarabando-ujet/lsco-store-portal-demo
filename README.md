# LS&Co. "To Go" mock portal – UJET Levi's showcase demo

Simple structure, agreed with Adam on 19 Oct:

```
Web portal (GitHub Pages) ──auth state──▶ Google Sheet (Auth tab) ◀── Cloud Run ◀── Virtual Agent (Adam, later)
        └── UJET chat widget added by the Tampermonkey injector v0.10 (unchanged)
```

- **Portal:** the UI as before (tiles, counters, tickets, orders, devices, KB, simulated Entra ID sign-in with Amanda / Joana). There's no chat or variables column on the right.
- **Auth sheet:** on page load, sign-in, sign-out and persona switch, the portal writes one row: `auth_status`, `first_name`, `last_name`, `email` (+ `user_id`, `store_id`, `language`). Setup and the VA read contract are in **[sheet/README.md](sheet/README.md)**.
- **Chat:** the UJET Web SDK demo kit injects the widget as on any site. "Chat with Stitch" buttons open it if it's there.

## Files

```
index.html  config.js  css/styles.css
js/app.js           router, header/banner/footer, polling, presenter panel (Shift+P)
js/authsheet.js     writes the auth state to the Google Sheet (queued, 1 retry)
js/state.js         signed-in persona (sessionStorage)
js/router.js  js/i18n.js  js/components/ui.js  js/views/*.js
js/data/            mock (data/*.json) | api (Prompt B, later)
data/*.json         personas, stores, tickets, orders, devices, kb, categories, fixtures
sheet/              Code.gs (Apps Script), auth-table.csv, README.md
```

## Run locally

```bash
python3 -m http.server 8080   # in this folder → http://localhost:8080/
```

## Deploy (GitHub Pages)

1. Replace the repo contents with this folder (keep `.nojekyll` and `robots.txt`). Commit to `main`.
2. **Settings → Pages:** Deploy from branch `main` / root (already set up if the site is live).
3. Set up the sheet ([sheet/README.md](sheet/README.md)), then put `AUTH_SHEET.url` and `token` into `config.js`.
4. On the presenter laptop, the Tampermonkey injector stays **v0.10.x**. Pick the tenant on the site with Option+Shift+U.

## Presenter panel (Shift+P)

Switch persona (Amanda / Joana / sign out). Every switch updates the sheet. You can also:

- switch mock/api data
- force a refresh
- simulate UC events (iPad order, NYC outage, comment on INC0010234, ticket On Hold)
- reset mock data
- **Re-send auth state**: shows the last sheet write

## Routes

`#/welcome` `#/locations` `#/locations/:id` `#/login` (public) · `#/` `#/support/:category` `#/tickets` `#/tickets/:number` `#/orders` `#/orders/:number` `#/devices` `#/devices/:serial` `#/kb` `#/kb/:id` `#/store` `#/profile` `#/search?q=` (signed in)

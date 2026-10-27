# LS&Co. "To Go" mock portal – UJET Levi's showcase demo

Simple structure, agreed with Adam on 19 Oct:

```
Web portal (GitHub Pages) ──auth state──▶ Google Sheet (Auth tab) ◀── Cloud Run ◀── Virtual Agent (Adam, later)
        └── embedded UJET Web SDK v3 chat (svcnow) ◀── login token + signed custom data from the same Apps Script
```

- **Portal:** the UI as before (tiles, counters, tickets, orders, devices, KB, simulated Entra ID sign-in with Amanda / Joana). There's no chat or variables column on the right.
- **Auth sheet:** on page load, sign-in, sign-out and persona switch, the portal writes one row: `auth_status`, `first_name`, `last_name`, `email` (+ `user_id`, `store_id`, `language`). Setup and the VA read contract are in **[sheet/README.md](sheet/README.md)**.
- **Chat:** the portal embeds the UJET Web SDK v3 itself (`js/websdk.js`). The tenant host, company key and secret are in the sheet's **Tenant** tab. The Apps Script signs the login token and custom data from the Auth row, so the secret never reaches the browser. The chat restarts with the new user on every sign-in, sign-out or persona switch. **Turn the Tampermonkey injector off for this site** (Option+Shift+U → Turn off here), otherwise two chats appear.

## Files

```
index.html  config.js  css/styles.css
js/app.js           router, header/banner/footer, polling, presenter panel (Shift+P)
js/authsheet.js     writes the auth state to the Google Sheet (queued, 1 retry)
js/websdk.js        embedded UJET chat: gets token + custom data from the Apps Script, restarts on sign-in/out
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
4. Fill in the sheet's **Tenant** tab and redeploy the Apps Script as a new version. In Tampermonkey, turn the injector off for this site.

## Presenter panel (Shift+P)

Switch persona (Amanda / Joana / sign out). Every switch updates the sheet. You can also:

- switch mock/api data
- force a refresh
- simulate UC events (iPad order, NYC outage, comment on INC0010234, ticket On Hold)
- reset mock data
- **Re-send auth state**: shows the last sheet write
- **Restart chat**: shows the chat status (`✓ svcnow.ujetdemo.co · Amanda Scarpin`)

## Routes

`#/welcome` `#/locations` `#/locations/:id` `#/login` (public) · `#/` `#/support/:category` `#/tickets` `#/tickets/:number` `#/orders` `#/orders/:number` `#/devices` `#/devices/:serial` `#/kb` `#/kb/:id` `#/store` `#/profile` `#/search?q=` (signed in)

# Auth table (Google Sheet)

```
Web portal ──writes on load / sign-in / sign-out──▶ Google Sheet "Auth" tab ◀──reads── Cloud Run (SC demo project 2) ◀── Virtual Agent
```

The portal never talks to the VA directly. It keeps one row up to date, and the VA reads that row whenever it needs the auth state. That covers a chat that started before the user signed in.

| key | auth_status | first_name | last_name | email | user_id | store_id | language | updated_at | source |
|---|---|---|---|---|---|---|---|---|---|
| current | FALSE | | | | | | | 2026-10-19T15:10:00Z | user.github.io |
| current | TRUE | Amanda | Scarpin | amanda.scarpin@example.com | E322001 | 322 | en | … | … |
| current | TRUE | Joana | Ferreira | joana.ferreira@example.com | E415001 | 415 | pt | … | … |

These are the three states. There is still only one row, and it is overwritten each time. The **Log** tab keeps every change for testing.

## Setup (~10 min)

1. Create a Google Sheet, e.g. **LSCO demo – auth table**. The script creates the `Auth` and `Log` tabs itself; `auth-table.csv` shows the columns.
2. Go to **Extensions > Apps Script**, paste `Code.gs` and save.
3. In **Project Settings > Script properties**, add `DEMO_KEY` = a random string.
4. Go to **Deploy > New deployment > Web app**. Execute as **Me**, Who has access **Anyone**. Deploy, authorise, and copy the `/exec` URL.
5. Re-run **setup** once (it adds the **Tenant** tab) and fill in the Tenant tab (above). Then **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**.
6. In the portal's `config.js`, set `AUTH_SHEET.url` to the `/exec` URL and `AUTH_SHEET.token` to the `DEMO_KEY`. Commit.
7. Test:
   - Open the portal: the row shows `FALSE`.
   - Sign in as Amanda: `TRUE`, Amanda, Scarpin.
   - Shift+P → Joana: `TRUE`, Joana, Ferreira.
   - Sign out: `FALSE`.

   The portal footer shows `Auth sheet ✓ saved hh:mm:ss`.

## Embedded chat (UJET Web SDK v3, svcnow tenant)

The portal embeds the UJET chat itself, so Tampermonkey isn't needed on this site. After each auth change, the portal calls `?action=widget`. The script reads the **Auth** row and the **Tenant** tab and returns:
- the tenant host, company key and menu key
- a signed login token (guest, or the signed-in user's email and name)
- signed custom data: `auth_status`, `reserved_verified_customer`, `first_name`, `last_name`, `email`, `user_id`, `store_id`, `language`, `portal_session_id`

The company secret is only used inside the script to sign. It is never sent to the browser.

**Tenant tab** (created by `setup`):

| setting | value |
|---|---|
| host | `svcnow.ujetdemo.co` (CCaaS host, no `https://`) |
| company_key | from UJET **Settings → Developer Settings** (or the SC tenant sheet, column D) |
| company_secret | Company Secret (SC tenant sheet, column E) |
| menu_key_guest | optional: chat menu / DAP key for signed-out visitors |
| menu_key_signed_in | optional: chat menu / DAP key for Amanda / Joana |
| screenshare_license | Screen Share license key (SC tenant sheet, "Screen Share License"). Empty = Screen Share off |
| screenshare_domain | `https://cobrowse.io` (default) |

**Screen Share:** with a license in the Tenant tab, the portal passes `cobrowse: { enabled, license, api, trustedOrigins }` to the widget, so new chats are created as cobrowsable and the agent gets **Start Screen Share**. The license is not a secret. Chats started before the change stay non-cobrowsable, so start a new chat to test.

⚠️ Anyone who can open this Google Sheet can read the secret. Share it only with Adam, and keep the link private. A safer option: leave `company_secret` empty and add a **Script property** `COMPANY_SECRET` instead. It takes priority, and it isn't visible in the sheet.

On every sign-in, sign-out or persona switch, the portal ends the current chat and starts a new one with the new user. The VA should still re-read the sheet during a chat (below), because a chat that is already open keeps its starting custom data.

## For the VA (Adam)

```
GET <exec URL>?action=get&key=current&token=<DEMO_KEY>
→ {"ok":true,"auth":{"key":"current","auth_status":true,"first_name":"Amanda","last_name":"Scarpin","email":"amanda.scarpin@example.com","user_id":"E322001","store_id":"322","language":"en","updated_at":"…"}}
```

- **Variables to map:** `auth_status`, `first_name`, `last_name`, `email`. `user_id`, `store_id` and `language` are there if needed later.
- **Re-read the row before anything account-specific,** not just at chat start. That way a user who signs in mid-chat is picked up.
- **Redirect:** Apps Script answers with a 302 redirect to `script.googleusercontent.com`. Cloud Run (Node `fetch`, Python `requests`) follows it by default.
- **Alternative to Apps Script:** Cloud Run can read the sheet directly with the Sheets API. Share the sheet with the Cloud Run service account and read `Auth!A:J`.

## Notes / limits (keep it simple for now)

- **One row = one demo at a time.** If two people demo at once, give each a key (`AUTH_SHEET.key`, e.g. `nuno`) and tell the VA which key to read.
- **Light security.** The token is visible in the public `config.js`, so it only keeps casual visitors out. Demo data only.
- **Before a demo,** open the portal signed out (or click Sign out) so the row starts as `FALSE`.
- **After editing `Code.gs`,** redeploy as a **New version** of the same deployment, otherwise the URL keeps the old code.

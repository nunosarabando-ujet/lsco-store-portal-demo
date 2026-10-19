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
5. In the portal's `config.js`, set `AUTH_SHEET.url` to the `/exec` URL and `AUTH_SHEET.token` to the `DEMO_KEY`. Commit.
6. Test:
   - Open the portal: the row shows `FALSE`.
   - Sign in as Amanda: `TRUE`, Amanda, Scarpin.
   - Shift+P → Joana: `TRUE`, Joana, Ferreira.
   - Sign out: `FALSE`.

   The portal footer shows `Auth sheet ✓ saved hh:mm:ss`.

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

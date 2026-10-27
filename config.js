// Public demo configuration. This file ships to GitHub Pages: NEVER put secrets here.
// The UJET chat (Web SDK v3) is embedded by js/websdk.js; tenant + secret live in the Google Sheet's Tenant tab.
export const CONFIG = {
  DATA_SOURCE: "mock",            // "mock" | "api"  (presenter panel can override per browser session)
  API_BASE_URL: "https://levis-portal-auth-XXXX.a.run.app",
  POLL_MS: 5000,
  BANNER_POLL_MS: 15000,
  SNOW_INSTANCE_URL: "https://ven04877.service-now.com",
  SHOW_SNOW_LINKS: true,
  // Google Sheet "auth table" (Apps Script web app, see /sheet). The portal writes; the Virtual Agent reads.
  AUTH_SHEET: {
    enabled: true,
    url: "https://script.google.com/macros/s/AKfycbySHMQTcccyBg_H_oUsn5zbV8hbocX0ZY84TF79-2BSEfJAqnsDsuOkX8UivtGRlGj0/exec",
    token: "lsco-7f3k9q2x",   // same value as the DEMO_KEY script property (light protection only: this file is public)
    key: "current"                    // row key; use one per presenter if several demos run at once
  },
  // Embedded UJET chat. Host, company key and menu keys come from the sheet's Tenant tab (via the Apps Script).
  CHAT: {
    enabled: true,
    accent: "#c41230",               // launcher colour
    logo: ""                         // optional https:// logo for the chat header
  },
  PRESENTER_MODE_KEY: "p"         // Shift+P toggles the presenter panel
};

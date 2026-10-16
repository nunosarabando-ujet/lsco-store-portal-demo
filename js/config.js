/* LS&Co. To Go — demo portal configuration
 * Edit this file only. Never put secrets here: the site is public (GitHub Pages).
 */
window.PORTAL_CONFIG = {
  // 'mock' = seeded data in the browser (js/data.js), 'api' = levis-portal-auth on Cloud Run
  dataMode: 'mock',
  apiBase: 'https://levis-portal-auth-XXXXXXXX-uc.a.run.app', // used when dataMode = 'api'
  pollMs: 5000,

  // ServiceNow instance for "Open in ServiceNow" buttons
  serviceNowBase: 'https://ven04877.service-now.com',

  // How the UJET chat gets onto the page:
  //  'demokit'  – (default) the UJET Web SDK Demo Kit adds it: local injector (npm run injector,
  //               localhost:3100) signs the JWT, the Tampermonkey userscript loads the widget.
  //               The portal loads NO UJET code; the side panel shows the picker values
  //               (email, DAP, signed custom data) for the signed-in persona.
  //  'embedded' – the portal loads the Web SDK itself (needs a token endpoint; see README).
  //  'mock'     – scripted Stitch only (rehearsal / backup).
  chatMode: 'demokit',

  ujet: {
    tenant: 'svcnow',                       // Demo Kit tenant id (first part of svcnow.ujetdemo.co)
    host: 'https://svcnow.ujetdemo.co',
    brandColour: '#C41230',
    menus: {
      signedIn: 'REPLACE_STORE_SUPPORT_MENU_KEY',   // DAP: Store Support → Stitch (verified)
      guest:    'REPLACE_STORE_LOCATOR_GUEST_MENU_KEY' // DAP: Store Locator – Guest → Stitch
    },
    // Chat language per persona. Joana → European Portuguese so the role-player sees pt-PT
    // (action item from the 16 Oct RFP sync).
    languageByPersona: { amanda: 'en', joana: 'pt-PT' },

    // only used when chatMode = 'embedded'
    loaderUrl: 'https://websdk.ujet.co/v3/loader.js',
    companyId: 'REPLACE_WITH_COMPANY_KEY',
    tokenUrl: 'http://localhost:3100/token'  // or apiBase + '/auth/token' (Prompt B)
  },

  // Offer the scripted "Stitch" chat in the side panel as a backup
  mockChatFallback: true
};

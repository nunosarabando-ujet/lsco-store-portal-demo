/* Seed data for mock mode. Keep numbers and serials aligned with the ServiceNow PDI
 * (ven04877) and the Cloud Run mock seed so the portal, Stitch and SNOW tell one story.
 */
(function () {
  const SEED = {
    personas: {
      amanda: {
        id: 'amanda', employeeId: 'E322017', name: 'Amanda Scarpin', firstName: 'Amanda',
        role: 'Store Manager', email: 'amanda.scarpin@levi-demo.com', mobileMasked: '***-***-1234',
        storeId: '322', language: 'en', avatar: 'AS'
      },
      joana: {
        id: 'joana', employeeId: 'E415008', name: 'Joana Ferreira', firstName: 'Joana',
        role: 'Store Lead', email: 'joana.ferreira@levi-demo.com', mobileMasked: '+351 *** *** 678',
        storeId: '415', language: 'pt', avatar: 'JF'
      }
    },

    stores: [
      { id: '322', name: 'New York – Broadway', city: 'New York, NY', address: '1155 Broadway, New York, NY 10001', region: 'NYC', circuit: 'NYC-ISP-01', phone: '+1 212 555 0322', hours: 'Mon–Sat 10:00–21:00 · Sun 11:00–19:00', manager: 'Amanda Scarpin', lte: true, language: 'en', status: 'ok' },
      { id: '318', name: 'New York – SoHo', city: 'New York, NY', address: '535 Broadway, New York, NY 10012', region: 'NYC', circuit: 'NYC-ISP-01', phone: '+1 212 555 0318', hours: 'Mon–Sat 10:00–20:00 · Sun 11:00–19:00', manager: 'Marcus Lee', lte: false, language: 'en', status: 'ok' },
      { id: '327', name: 'New York – Herald Square', city: 'New York, NY', address: '34 W 34th St, New York, NY 10001', region: 'NYC', circuit: 'NYC-ISP-01', phone: '+1 212 555 0327', hours: 'Mon–Sat 09:00–21:00 · Sun 10:00–20:00', manager: 'Priya Natarajan', lte: true, language: 'en', status: 'ok' },
      { id: '331', name: 'Brooklyn – Williamsburg', city: 'Brooklyn, NY', address: '110 N 6th St, Brooklyn, NY 11249', region: 'NYC', circuit: 'NYC-ISP-01', phone: '+1 718 555 0331', hours: 'Mon–Sun 11:00–20:00', manager: 'Dev Patel', lte: false, language: 'en', status: 'ok' },
      { id: '340', name: 'Queens – Queens Center', city: 'Elmhurst, NY', address: '90-15 Queens Blvd, Elmhurst, NY 11373', region: 'NYC', circuit: 'NYC-ISP-01', phone: '+1 718 555 0340', hours: 'Mon–Sat 10:00–21:30 · Sun 11:00–19:00', manager: 'Rosa Alvarez', lte: true, language: 'en', status: 'ok' },
      { id: '415', name: 'Lisboa – Chiado', city: 'Lisboa, Portugal', address: 'Rua Garrett 40, 1200-204 Lisboa', region: 'EU-PT', circuit: 'PT-ISP-01', phone: '+351 21 555 0415', hours: 'Seg–Dom 10:00–20:00', manager: 'Joana Ferreira', lte: true, language: 'pt', status: 'ok' }
    ],

    incidents: [
      { number: 'INC0010234', storeId: '415', short: 'EPOS receipt printer not printing (Till 1)', shortPt: 'Impressora de talões do EPOS não imprime (Caixa 1)', category: 'POS / EPOS', state: 'In Progress', priority: '3 - Moderate', opened: '2026-10-13 10:42', updated: '2026-10-15 16:05', assignment: 'Store IT Service Desk', parent: null,
        notes: [
          { at: '2026-10-15 16:05', by: 'Store IT Service Desk', text: 'Replacement thermal print head dispatched by courier. Expected at store Fri 16 Oct before 12:00. Technician remote session booked for 14:00 to recalibrate.', textPt: 'Cabeça de impressão térmica de substituição enviada por estafeta. Prevista na loja sex. 16 out. antes das 12:00. Sessão remota com técnico às 14:00 para recalibrar.' },
          { at: '2026-10-13 10:42', by: 'Stitch (virtual agent)', text: 'Store reported faded/blank receipts on Till 1. Guided printer self-test: failed. Logged with steps tried.', textPt: 'Loja reportou talões em branco na Caixa 1. Autoteste da impressora guiado: falhou. Registado com os passos tentados.' }
        ] },
      { number: 'INC0093828', storeId: '322', short: 'Stockroom handheld scanner not syncing stock counts', category: 'Hardware', state: 'On Hold', holdReason: 'Awaiting Caller', priority: '3 - Moderate', opened: '2026-10-14 09:15', updated: '2026-10-15 18:20', assignment: 'Store IT Service Desk', parent: null,
        task: 'Need store manager confirmation: is the scanner on the stockroom Wi-Fi (SSID LS-OPS) or the guest network?',
        notes: [
          { at: '2026-10-15 18:20', by: 'Store IT Service Desk', text: 'Called store x2 — manager off shift. Set to Awaiting Caller. Outbound follow-up by Stitch requested.' },
          { at: '2026-10-14 09:15', by: 'Amanda Scarpin', text: 'Zebra scanner in stockroom shows counts but they never reach the back-office app.' }
        ] },
      { number: 'INC0093701', storeId: '322', short: 'Fitting room 3 light flickering', category: 'Facilities', state: 'Resolved', priority: '4 - Low', opened: '2026-10-08 14:02', updated: '2026-10-09 11:30', assignment: 'Facilities', parent: null,
        notes: [{ at: '2026-10-09 11:30', by: 'Facilities', text: 'Ballast replaced by contractor.' }] }
    ],

    orders: [
      { number: 'RITM0010002', request: 'REQ0010002', storeId: '415', item: 'Replacement iPad', itemPt: 'iPad de substituição', serial: 'DMPXLS415001', reason: 'Broken screen', state: 'Closed Complete', stage: 'Delivered', opened: '2026-09-02 11:20', eta: '2026-09-04', requestedFor: 'Joana Ferreira', assignment: 'Hardware Fulfillment', tracking: 'PT-DHL-88341207', active: false },
      { number: 'RITM0012101', request: 'REQ0012101', storeId: '322', item: 'Fixtures: 2 × Rolling rack (FX-RR-01) · HOL26', serial: null, reason: 'Holiday 26 campaign', state: 'Work in Progress', stage: 'Shipped', opened: '2026-10-09 15:10', eta: '2026-10-15', requestedFor: 'Amanda Scarpin', assignment: 'Visual Merchandising', tracking: 'UPS 1Z999AA10123456784', active: true, fm: true },
      { number: 'RITM0012107', request: 'REQ0012107', storeId: '415', item: 'Fixtures: 1 × Holiday kit C (KIT-HOL26-C) · HOL26', itemPt: 'Expositores: 1 × Kit Natal C (KIT-HOL26-C) · HOL26', serial: null, reason: 'Holiday 26 campaign', state: 'Work in Progress', stage: 'Delayed at vendor', opened: '2026-10-05 10:00', eta: '2026-11-16', requestedFor: 'Joana Ferreira', assignment: 'Visual Merchandising', tracking: null, active: true, fm: true }
    ],

    devices: [
      { serial: 'DMPXR8L24K2', storeId: '322', model: 'iPad 10th gen 64GB', name: 'Till 2 iPad', location: 'Sales floor – Till 2', status: 'In use', warranty: 'AppleCare+ until 2027-03-31', replacements90d: 0 },
      { serial: 'DMPXT5W17Q9', storeId: '322', model: 'iPad 10th gen 64GB', name: 'Stockroom iPad', location: 'Stockroom', status: 'In use', warranty: 'AppleCare+ until 2027-03-31', replacements90d: 0 },
      { serial: 'H6TVQ3N81MZ', storeId: '322', model: 'iPad Air 11" 128GB', name: 'Manager iPad', location: 'Manager office', status: 'In use', warranty: 'AppleCare+ until 2027-08-15', replacements90d: 0 },
      { serial: 'DMPXLS415001', storeId: '415', model: 'iPad 10th gen 64GB', name: 'iPad Caixa 1', location: 'Loja – Caixa 1', status: 'In use', warranty: 'AppleCare+ until 2027-09-02', replacements90d: 1 },
      { serial: 'DMPXLS415002', storeId: '415', model: 'iPad 10th gen 64GB', name: 'iPad Armazém', location: 'Armazém', status: 'In use', warranty: 'AppleCare+ until 2027-01-20', replacements90d: 0 },
      { serial: 'GW-322-ARUBA', storeId: '322', model: 'Aruba 9004 Gateway', name: 'Store gateway', location: 'Comms cabinet', status: 'Up', warranty: 'Foundation Care', replacements90d: 0, network: true },
      { serial: 'AP-322-STK', storeId: '322', model: 'Aruba AP-535', name: 'Stockroom AP', location: 'Stockroom', status: 'Up', warranty: 'Foundation Care', replacements90d: 0, network: true },
      { serial: 'GW-415-ARUBA', storeId: '415', model: 'Aruba 9004 Gateway', name: 'Gateway da loja', location: 'Bastidor', status: 'Up', warranty: 'Foundation Care', replacements90d: 0, network: true }
    ],

    // Operational support requests (non-IT: merchandising, payroll queries, supplies…) shown on the home counter
    opsRequests: [
      { number: 'OPS0004411', storeId: '322', short: 'Extra cleaning crew for Saturday sample sale', state: 'In Progress', team: 'Store Operations', opened: '2026-10-12' },
      { number: 'OPS0004417', storeId: '322', short: 'Replenish shopping bags (large) — 2 cases', state: 'Awaiting Delivery', team: 'Store Supplies', opened: '2026-10-13' },
      { number: 'OPS0004420', storeId: '322', short: 'Holiday staffing roster approval', state: 'Pending Approval', team: 'Regional Ops', opened: '2026-10-14' },
      { number: 'OPS0004426', storeId: '322', short: 'Security tag gates recalibration visit', state: 'Scheduled', team: 'Loss Prevention', opened: '2026-10-14' },
      { number: 'OPS0004431', storeId: '322', short: 'Window vinyl removal after Fall campaign', state: 'New', team: 'Visual Merchandising', opened: '2026-10-15' },
      { number: 'OPS0004433', storeId: '322', short: 'Cash collection schedule change', state: 'In Progress', team: 'Finance Ops', opened: '2026-10-15' },
      { number: 'OPS0004402', storeId: '415', short: 'Reposição de sacos (médios)', state: 'In Progress', team: 'Store Supplies', opened: '2026-10-10' },
      { number: 'OPS0004429', storeId: '415', short: 'Aprovação do horário de Natal', state: 'Pending Approval', team: 'Regional Ops', opened: '2026-10-15' }
    ],
    questions: [],

    approvals: [
      { number: 'RITM0012099', storeId: '322', what: 'Seasonal signage reprint (HOL26) — over allocation by $120', waitingOn: 'Regional VM Manager – NYC', since: '2026-10-14' }
    ],

    kb: [
      { id: 'KB0010001', cat: 'POS / EPOS', title: 'Soft and hard reboot of a frozen till', titlePt: 'Reiniciar uma caixa bloqueada', views: 1240,
        body: ['Ask customers to wait and void any open basket if possible.', 'Soft reboot: hold the power button for 3 s and choose Restart.', 'If the screen is still frozen after 2 minutes, hard reboot: hold power for 15 s until the screen goes dark, wait 10 s, press power again.', 'Log in and confirm the terminal shows ONLINE in the status bar.', 'Still frozen? Ask Stitch in the chat panel — it will check the terminal heartbeat and open a ticket with the steps you tried.'] },
      { id: 'KB0010002', cat: 'Payments', title: 'Card reader error E-204 "Host not reachable"', titlePt: 'Erro E-204 do terminal de pagamento', views: 860,
        body: ['E-204 means the PIN pad cannot reach the payment host.', 'Check the network cable at the back of the reader is clicked in.', 'Restart the PIN pad (unplug power 10 s).', 'If other tills show the same error, the store may have lost its internet uplink — check the outage banner at the top of this portal.'] },
      { id: 'KB0010003', cat: 'Network', title: 'Stockroom Wi-Fi down: what to check', titlePt: 'Wi-Fi do armazém em baixo', views: 512,
        body: ['Check whether devices on the sales floor are online.', 'Look at the access point: solid green = OK, amber = no uplink, off = no power.', 'Do not unplug the comms cabinet. Stitch can remotely bounce the PoE port or reboot the AP.'] },
      { id: 'KB0010004', cat: 'Accounts', title: 'Locked out of iPad / back-office app', titlePt: 'Conta bloqueada no iPad / back-office', views: 1975,
        body: ['After 5 failed attempts your account locks for 30 minutes.', 'Ask Stitch to unlock it: you will be asked for your employee ID and a 6-digit code sent to your registered mobile.', 'Passwords are never read out or sent by chat — you receive a self-service reset link by SMS.'] },
      { id: 'KB0010005', cat: 'Hardware', title: 'iPad replacement policy for stores', titlePt: 'Política de substituição de iPads', views: 433,
        body: ['Each store can replace one iPad per 90 days without review.', 'A second request inside 90 days goes to Security Review: you will be asked for photos of the device and serial label.', 'Return the broken device with the prepaid label within 10 days.'] },
      { id: 'KB0010006', cat: 'Facilities', title: 'Shutters, lighting and HVAC are Facilities — not IT', titlePt: 'Estores, iluminação e AVAC: Manutenção', views: 301,
        body: ['Roller shutters, fitting-room lights, HVAC and plumbing are handled by Facilities.', 'Use the Facilities tile or tell Stitch — it raises a Facilities work order and texts you the link.'] }
    ],

    fixtures: [
      { sku: 'FX-RR-01', name: 'Rolling rack, chrome', cost: 240, img: '▤' },
      { sku: 'FX-TBL-NEST', name: 'Nesting table set (3)', cost: 690, img: '▭' },
      { sku: 'MNQ-F-STD', name: 'Female mannequin, standard', cost: 410, img: '♀' },
      { sku: 'MNQ-M-STD', name: 'Male mannequin, standard', cost: 410, img: '♂' },
      { sku: 'KIT-HOL26-A', name: 'Holiday 26 window kit A (small window)', cost: 520, img: '✦' },
      { sku: 'KIT-HOL26-C', name: 'Holiday 26 window kit C (large window)', cost: 650, img: '✶' }
    ],

    outage: { active: false, region: 'NYC', parent: null }
  };

  const KEY = 'lsco_demo_state_v2';
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function load() {
    try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) {}
    return clone(SEED);
  }
  let state = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  function nextNumber(prefix, list) {
    const nums = list.map(x => parseInt(String(x.number).replace(prefix, ''), 10)).filter(n => !isNaN(n));
    const n = Math.max(0, ...nums) + 1;
    return prefix + String(n).padStart(7, '0');
  }
  function now() {
    const d = new Date(); const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  window.DemoData = {
    get: () => state,
    reset() { state = clone(SEED); save(); },
    reload() { state = load(); },
    save,
    // ---- simulated events (presenter panel + mock chat) ----
    createIpadOrder(storeId, serial, reason, requestedFor) {
      const number = nextNumber('RITM', state.orders);
      const eta = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
      const o = { number, request: number.replace('RITM', 'REQ'), storeId, item: 'Replacement iPad', itemPt: 'iPad de substituição', serial, reason, state: 'Work in Progress', stage: 'Fulfillment', opened: now(), eta, requestedFor, assignment: 'Hardware Fulfillment', tracking: 'Return label emailed', active: true, fresh: true };
      state.orders.unshift(o);
      const dev = state.devices.find(d => d.serial === serial); if (dev) dev.status = 'Replacement ordered';
      save(); return o;
    },
    startOutage() {
      if (state.outage.active) return state.outage.parent;
      const parent = nextNumber('INC', state.incidents);
      const nyc = state.stores.filter(s => s.region === 'NYC');
      nyc.forEach(s => s.status = 'down');
      state.incidents.unshift({ number: parent, storeId: '322', short: 'MAJOR INCIDENT: NYC stores offline — ISP circuit NYC-ISP-01 down', category: 'Network', state: 'In Progress', priority: '1 - Critical', major: true, opened: now(), updated: now(), assignment: 'Network Operations', parent: null,
        notes: [{ at: now(), by: 'Stitch (virtual agent)', text: 'Store #322 reported tills and iPads offline. Gateway uplink DOWN; remote port bounce failed. Region check: 5 stores DOWN on circuit NYC-ISP-01. Major incident raised, carrier ticket opened, LTE failover steps given, managers of #318 #327 #331 #340 notified by SMS.' }] });
      const child = nextNumber('INC', state.incidents);
      state.incidents.unshift({ number: child, storeId: '322', short: 'Tills and iPads offline at #322', category: 'Network', state: 'In Progress', priority: '2 - High', opened: now(), updated: now(), assignment: 'Network Operations', parent,
        notes: [{ at: now(), by: 'Stitch (virtual agent)', text: 'Linked to major incident ' + parent + '. ETA from carrier 2 h. Store advised to switch tills to LTE backup.' }] });
      const gw = state.devices.find(d => d.serial === 'GW-322-ARUBA'); if (gw) gw.status = 'Down';
      state.outage = { active: true, region: 'NYC', parent };
      save(); return parent;
    },
    endOutage() {
      state.stores.forEach(s => s.status = 'ok');
      state.incidents.forEach(i => { if (i.major || (state.outage.parent && i.parent === state.outage.parent)) { i.state = 'Resolved'; i.updated = now(); } });
      const gw = state.devices.find(d => d.serial === 'GW-322-ARUBA'); if (gw) gw.status = 'Up';
      state.outage = { active: false, region: 'NYC', parent: null }; save();
    },
    resolveAwaitingInfo() {
      const i = state.incidents.find(x => x.number === 'INC0093828');
      if (i) { i.state = 'In Progress'; delete i.holdReason; i.updated = now(); i.notes.unshift({ at: now(), by: 'Stitch (outbound follow-up)', text: 'Reached Amanda Scarpin (store manager) on 2nd attempt at shift start. Confirmed scanner is on guest Wi-Fi. Moved to LS-OPS; sync confirmed. No agent time used.' }); }
      save();
    },
    createFacilities(storeId, text) {
      const number = nextNumber('INC', state.incidents);
      state.incidents.unshift({ number, storeId, short: text, category: 'Facilities', state: 'New', priority: '4 - Low', opened: now(), updated: now(), assignment: 'Facilities', parent: null, notes: [{ at: now(), by: 'Stitch (front-door triage)', text: 'Non-IT contact steered to Facilities. Store texted the Facilities portal link. ETA next business day.' }] });
      save(); return number;
    }
  };
})();

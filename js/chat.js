/* Docked chat panel.
 * chatMode 'demokit'  – UJET Web SDK Demo Kit injects the widget; panel shows the picker values.
 * chatMode 'embedded' – portal loads the Web SDK into #chat-mount (token from config.ujet.tokenUrl).
 * chatMode 'mock'     – scripted "Stitch" backup chat.
 */
(function () {
  const CFG = window.PORTAL_CONFIG;
  const SESSION_KEY = 'lsco_portal_session';

  // ---------- session (window.LSCO_SESSION + localStorage, readable by any userscript) ----------
  const Session = {
    get() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; } catch (e) { return null; } },
    set(persona) {
      const s = {
        persona: persona.id, employee_id: persona.employeeId, name: persona.name, email: persona.email,
        role: persona.role, store_id: persona.storeId, language: persona.language,
        chat_language: CFG.ujet.languageByPersona[persona.id] || persona.language,
        auth_level: 'sso', sso_method: 'Microsoft Entra ID (simulated)', signed_in_at: new Date().toISOString(),
        mobile_masked: persona.mobileMasked
      };
      try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) {}
      publish(s); return s;
    },
    clear() { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} publish(null); }
  };
  function publish(s) {
    window.LSCO_SESSION = s ? Object.assign({}, s) : { auth_level: 'anonymous' };
    window.dispatchEvent(new CustomEvent('lsco:session', { detail: window.LSCO_SESSION }));
  }
  publish(Session.get());

  // ---------- UJET Web SDK ----------
  let ujetClient = null, ujetMode = null;
  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const s = document.createElement('script'); s.src = src; s.async = true;
      s.onload = res; s.onerror = () => rej(new Error('UJET loader failed')); document.head.appendChild(s);
    });
  }
  function waitFor(fn, ms) {
    return new Promise(res => { const t0 = Date.now(); (function poll() { const v = fn(); if (v || Date.now() - t0 > ms) return res(v); setTimeout(poll, 150); })(); });
  }
  async function getAuth(session) {
    if (!session) return {};
    // Same contract as the Demo Kit injector: POST persona → { token, signedCustomData }
    const r = await fetch(CFG.ujet.tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: session.email, name: session.name, custom_data: customData(session) }) });
    if (!r.ok) throw new Error('token ' + r.status);
    return await r.json();
  }
  async function startUjet(session) {
    const u = CFG.ujet;
    const mode = session ? 'signedIn' : 'guest';
    if (ujetClient && ujetMode === mode) return true;
    await loadScript(u.loaderUrl);
    await waitFor(() => window.UJET, 5000);
    if (!window.UJET) throw new Error('UJET global missing');
    if (ujetClient) { try { ujetClient.destroy && ujetClient.destroy(); } catch (e) {} ujetClient = null; }
    document.getElementById('chat-mount').innerHTML = '';
    const auth = await getAuth(session);
    const lang = session ? session.chat_language : (document.documentElement.lang || 'en');
    ujetClient = new window.UJET({
      companyId: u.companyId,
      host: u.host,
      lang: /^pt/.test(lang) ? 'pt' : 'en',
      authenticate: () => Promise.resolve(auth.token ? { token: auth.token } : {})
    });
    if (auth.signedCustomData && ujetClient.config) ujetClient.config({ signedCustomData: auth.signedCustomData });
    if (ujetClient.mount) ujetClient.mount('#chat-mount');
    const menuKey = session ? u.menus.signedIn : u.menus.guest;
    if (ujetClient.start) ujetClient.start({ menuKey });
    ujetMode = mode;
    return true;
  }

  // ---------- scripted Stitch backup ----------
  const M = { log: null, input: null, ctx: {} };
  const T = (en, pt) => (lang() === 'pt' ? pt : en);
  function lang() { const s = Session.get(); return s ? s.language : (window.App ? App.lang() : 'en'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function bubble(who, html, extraClass) {
    const d = document.createElement('div'); d.className = 'msg ' + who + (extraClass ? ' ' + extraClass : '');
    d.innerHTML = html; M.log.appendChild(d); M.log.scrollTop = M.log.scrollHeight; return d;
  }
  function typing() { const d = bubble('bot', '<span class="dots"><i></i><i></i><i></i></span>', 'typing'); return () => d.remove(); }
  function say(html, delay) {
    return new Promise(res => { const stop = typing(); setTimeout(() => { stop(); bubble('bot', html); res(); }, delay || 700); });
  }
  function trace(text) { bubble('sys', '⚙ ' + esc(text)); }
  function chips(list) {
    const d = document.createElement('div'); d.className = 'chips';
    list.forEach(c => { const b = document.createElement('button'); b.textContent = c; b.onclick = () => { d.remove(); userSays(c); }; d.appendChild(b); });
    M.log.appendChild(d); M.log.scrollTop = M.log.scrollHeight;
  }

  async function greet() {
    M.log.innerHTML = ''; M.ctx = {};
    const s = Session.get(); const D = DemoData.get();
    if (!s) {
      await say(T('Hi! I\'m Stitch. ' , 'Olá! Sou o Stitch. ') + esc(I18N[lang()].guestNote), 400);
      chips(T(['Store hours near me', 'Where is the SoHo store?'], ['Horário da loja do Chiado', 'Lojas em Nova Iorque']));
      return;
    }
    const open = D.incidents.filter(i => i.storeId === s.store_id && !['Resolved', 'Closed'].includes(i.state)).length
      + (D.opsRequests || []).filter(o => o.storeId === s.store_id).length;
    await say(T(`Hi ${esc(s.name.split(' ')[0])} 👋 I can fix tech issues, order equipment, or check any of your ${open} open requests. What do you need?`,
      `Olá ${esc(s.name.split(' ')[0])} 👋 Posso resolver problemas técnicos, encomendar equipamento ou ver qualquer um dos seus ${open} pedidos em aberto. Do que precisa?`), 400);
    chips(T(['Report an outage', 'Order equipment', 'Check a ticket'], ['Reportar uma falha', 'Encomendar equipamento', 'Ver um pedido']));
  }

  async function userSays(text) {
    bubble('me', esc(text));
    const t = text.toLowerCase(); const s = Session.get(); const D = DemoData.get();

    // pending OTP step
    if (M.ctx.awaitOtp) {
      if (/^\s*\d{6}\s*$/.test(text)) { M.ctx.awaitOtp = false; trace('verify_otp → valid · idv_method=sms_otp'); return M.ctx.afterOtp(); }
      return say(T('That code should be 6 digits — please try again.', 'O código deve ter 6 dígitos — tente novamente.'));
    }
    // pending device pick
    if (M.ctx.pickDevice) { const dev = D.devices.find(d => d.storeId === (s && s.store_id) && /iPad/.test(d.model) && (text.includes(d.name) || d.location.includes(text))); if (dev) { M.ctx.pickDevice = false; return orderFor(dev); } }

    if (!s) { // guest: store locator only
      const store = D.stores.find(st => t.includes(st.name.split('–')[1]?.trim().toLowerCase() || '###') || t.includes(st.id));
      if (/hour|horári|open|aberta|store|loja|where|onde|soho|chiado|broadway|nova iorque|new york/.test(t)) {
        const list = store ? [store] : D.stores.filter(st => (lang() === 'pt' ? /chiado|lisboa/.test(t) ? st.region === 'EU-PT' : st.region === 'NYC' : st.region === 'NYC')).slice(0, 3);
        trace('store_locator_faq_agent → get_store_info (public)');
        return say(list.map(st => `<b>#${st.id} ${esc(st.name)}</b><br>${esc(st.address)}<br>${esc(st.hours)}`).join('<hr>'));
      }
      return say(T('I can only help with store locations and hours until you sign in. Use <b>Sign in</b> at the top right for tickets, orders and devices.',
        'Sem sessão iniciada só posso ajudar com moradas e horários. Use <b>Iniciar sessão</b> no canto superior direito para pedidos, encomendas e equipamentos.'));
    }

    if (M.ctx.confirmOrder) {
      const dev = M.ctx.confirmOrder; M.ctx.confirmOrder = null;
      if (/^(y|yes|sim|ok|please|confirm)/.test(t)) return placeOrder(dev);
      return say(T('No problem — nothing has been ordered.', 'Sem problema — não foi encomendado nada.'));
    }
    if (/^(order equipment|encomendar equipamento)$/.test(t)) {
      await say(T('Sure — what do you need? For example a replacement iPad, a scanner or a receipt printer.', 'Claro — de que precisa? Por exemplo um iPad de substituição, um leitor ou uma impressora de talões.'));
      return chips(T(['The screen on one of our iPads is smashed. I need a replacement.'], ['O ecrã de um dos nossos iPads partiu-se. Preciso de outro.']));
    }
    if (/^(report an outage|reportar uma falha)$/.test(t)) return userSays(T('Tills and iPads are offline', 'As caixas e os iPads estão sem ligação'));
    if (/^(check a ticket|ver um pedido)$/.test(t)) return userSays(T('Status of my ticket', 'Estado do pedido'));
    if (/ipad|tablet/.test(t) && /(broken|partiu|crack|smash|replace|substitu|outro|another|second|segundo|need|preciso)/.test(t)) {
      trace('device_ordering_agent → list_store_devices(store ' + s.store_id + ')');
      const ipads = D.devices.filter(d => d.storeId === s.store_id && /iPad/.test(d.model));
      const short = d => d.serial.slice(0, 4) + '…' + d.serial.slice(-3);
      await say(T(`Sorry about that! I found ${ipads.length} iPads assigned to Store #${s.store_id}. Which one?`, `Lamento! Encontrei ${ipads.length} iPads atribuídos à Loja #${s.store_id}. Qual deles?`));
      await say(`<div class="devlist">${ipads.map(d => `<div><b>${esc(d.model.replace(/ \d+GB$/, '').replace(/ 11"$/, ''))}</b> · SN ${esc(short(d))} · ${esc(d.location.replace('Sales floor – ', ''))}</div>`).join('')}</div>`, 300);
      M.ctx.pickDevice = true; chips(ipads.map(d => d.location.replace('Sales floor – ', '').replace('Loja – ', ''))); return;
    }
    if (/offline|outage|down|sem rede|sem ligação|till|caixa/.test(t)) {
      await say(T(`For security I've sent a 6-digit code to your registered mobile ${esc(s.mobile_masked)}. Please type it here.`, `Por segurança, enviei um código de 6 dígitos para o seu telemóvel registado ${esc(s.mobile_masked)}. Escreva-o aqui.`));
      trace('idv_agent → send_otp(employee ' + s.employee_id + ')');
      M.ctx.awaitOtp = true; M.ctx.afterOtp = outageFlow; return;
    }
    const inc = (text.match(/INC\d{7}/i) || [])[0] || (/status|estado|ticket|pedido/.test(t) ? (D.incidents.find(i => i.storeId === s.store_id && i.state !== 'Resolved') || {}).number : null);
    if (inc) {
      const i = D.incidents.find(x => x.number.toUpperCase() === inc.toUpperCase());
      trace('ticket_status_agent → get_ticket_status(' + inc + ')');
      if (!i) return say(T('I couldn\'t find that ticket for your store.', 'Não encontrei esse pedido para a sua loja.'));
      const n = i.notes[0];
      return say(`<div class="card"><div class="card-k">${esc(i.number)} · ${esc(i.state)}</div><div>${esc(lang() === 'pt' && i.shortPt ? i.shortPt : i.short)}</div><div class="card-sub">${esc(lang() === 'pt' && n.textPt ? n.textPt : n.text)}</div><a href="#/tickets/${i.number}">${T('Open ticket', 'Abrir pedido')} →</a></div>`);
    }
    if (/shutter|estore|light|luz|hvac|ar condicionado|avac|plumb|canaliz/.test(t)) {
      trace('triage_agent → intent=facilities → create_facilities_request');
      const n = DemoData.createFacilities(s.store_id, text);
      App.refresh();
      return say(T(`That's one for Facilities, not IT — I've raised work order <b>${n}</b> and texted you the Facilities portal link. ETA: next business day.`, `Isso é com a Manutenção, não com a informática — criei a ordem <b>${n}</b> e enviei-lhe por SMS o link do portal de Manutenção. Previsão: próximo dia útil.`));
    }
    if (/agent|human|alguém|pessoa|complain|reclama|falar/.test(t)) {
      trace('escalation_agent → escalate(queue=Store IT – EN, language=' + s.language + ')');
      return say(T('Connecting you to a Store IT specialist. I\'ve shared our conversation so you won\'t need to repeat yourself.', 'Vou ligá-lo a um especialista de língua inglesa com tradução em tempo real. Partilhei a nossa conversa para não ter de repetir nada.'));
    }
    return say(T('I can help with tills, iPads, Wi-Fi, payments, logins, orders and tickets. What\'s going on?', 'Posso ajudar com caixas, iPads, Wi-Fi, pagamentos, acessos, encomendas e pedidos. O que se passa?'));
  }

  async function orderFor(dev) {
    const s = Session.get();
    trace(`check_warranty_and_entitlement(${dev.serial}) → replacements_90d=${dev.replacements90d}`);
    if (dev.replacements90d >= 1) {
      trace('policy decision = REVIEW · risk_reason=SECURITY_REVIEW · no order created');
      await say(T(`This store already had an iPad replaced in the last 90 days, so I can't order another one automatically. I'm passing you to our Security Review team with everything we've discussed — they'll ask for a photo of the device and its serial label.`,
        `Esta loja já substituiu um iPad nos últimos 90 dias, por isso não posso encomendar outro automaticamente. Vou passá-la para a equipa de Revisão de Segurança com tudo o que falámos — vão pedir uma fotografia do equipamento e da etiqueta com o número de série.`), 1100);
      return say(`<div class="card warn"><div class="card-k">${T('Escalated · Security Review EN · priority', 'Encaminhado · Revisão de Segurança · prioritário')}</div><div class="card-sub">${T('Live chat translation PT ↔ EN will be on.', 'A tradução do chat PT ↔ EN estará ativa.')}</div></div>`);
    }
    const st = DemoData.get().stores.find(x => x.id === s.store_id) || {};
    const street = (st.address || '').split(',')[0];
    await say(T(`✅ Covered under warranty and within your store's replacement allowance. Ship to <b>Store #${s.store_id}, ${esc(street)}</b>?`,
      `✅ Coberto pela garantia e dentro da quota de substituições da loja. Envio para a <b>Loja #${s.store_id}, ${esc(street)}</b>?`), 1000);
    M.ctx.confirmOrder = dev; chips(T(['Yes please'], ['Sim, por favor']));
  }

  async function placeOrder(dev) {
    const s = Session.get();
    trace('create_catalog_request → ServiceNow RITM · create_fulfillment_order');
    const o = DemoData.createIpadOrder(s.store_id, dev.serial, 'Broken screen', s.name);
    App.refresh(true);
    const etaDay = new Date(o.eta + 'T12:00:00').toLocaleDateString(lang() === 'pt' ? 'pt-PT' : 'en-GB', { weekday: 'short' });
    return say(`<div class="card ok"><div class="card-k">📦 ${T('Order placed', 'Encomenda criada')} – ${esc(o.number)}</div><div>${T('Pre-enrolled replacement iPad', 'iPad de substituição pré-configurado')} · ${T('ETA', 'Previsão')} ${esc(etaDay)}</div><div class="card-sub">${T('Return label for SN', 'Etiqueta de devolução para o SN')} …${esc(dev.serial.slice(-3))} ${T('sent to your email', 'enviada para o seu email')}</div><a href="#/orders/${o.number}">${T('View order', 'Ver encomenda')} →</a></div>`, 900);
  }

  async function outageFlow() {
    const s = Session.get();
    await say(T('Verified, thanks. Checking your store network now…', 'Verificado, obrigado. A verificar a rede da loja…'), 500);
    trace('network_diagnostics_agent → get_site_health(store ' + s.store_id + ') → gateway uplink DOWN, APs healthy');
    trace('bounce_gateway_port → still DOWN');
    trace('get_region_health(NYC) → 5 stores DOWN on circuit NYC-ISP-01');
    const parent = DemoData.startOutage();
    trace('search_incidents → none · create_incident(major) ' + parent + ' · link_child_incident');
    App.refresh(true);
    return say(T(`This isn't just your store: 5 NYC stores on the same internet circuit are down. I've raised major incident <b>${parent}</b> with Network Operations and the carrier (ETA ~2 h) and texted the other 4 managers.<br><br>Meanwhile, switch your tills to LTE backup: Settings → Network → <b>Use cellular backup</b>.`,
      `Não é só a sua loja: 5 lojas estão sem rede. Criei o incidente grave <b>${parent}</b> (previsão ~2 h).`), 1300);
  }

  function mountMock() {
    const host = document.getElementById('chat-mount');
    host.innerHTML = `<div class="mock-chat"><div class="mock-log" id="mock-log" aria-live="polite"></div>
      <form class="mock-input" id="mock-form"><input id="mock-text" autocomplete="off" placeholder="${T('Type a message…', 'Escreva uma mensagem…')}" aria-label="Message"><button aria-label="Send">➤</button></form></div>`;
    M.log = document.getElementById('mock-log'); M.input = document.getElementById('mock-text');
    document.getElementById('mock-form').onsubmit = e => { e.preventDefault(); const v = M.input.value.trim(); if (v) { M.input.value = ''; userSays(v); } };
    greet();
  }


  // ---------- Demo Kit helpers ----------
  // Custom data for the Demo Kit picker ("Custom data" → tick "Sign it"). Shown to the agent
  // in the session data panel and passed to Stitch as session parameters.
  function customData(s) {
    if (!s) return { 'Sign-in status': 'Guest (not signed in)', auth_level: 'anonymous' };
    const D = DemoData.get(); const st = D.stores.find(x => x.id === s.store_id) || {};
    const open = D.incidents.filter(i => i.storeId === s.store_id && !['Resolved', 'Closed'].includes(i.state)).map(i => i.number);
    const orders = D.orders.filter(o => o.storeId === s.store_id && o.active).map(o => o.number);
    return {
      'Verified Customer': 'true', 'Sign-in method': s.sso_method, auth_level: 'sso',
      employee_id: s.employee_id, 'Employee': s.name, 'Role': s.role,
      store_id: s.store_id, 'Store': `#${s.store_id} ${st.name || ''}`, 'Region': st.region || '',
      language: s.chat_language, 'Registered mobile': s.mobile_masked,
      'Open tickets': open.join(', ') || 'none', 'Open orders': orders.join(', ') || 'none'
    };
  }
  function copy(text, btn) {
    const done = () => { const t = btn.textContent; btn.textContent = '✓ Copied'; setTimeout(() => btn.textContent = t, 1200); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => fallback()); else fallback();
    function fallback() { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} ta.remove(); }
  }
  function mountDemoKit() {
    const s = Session.get(); const u = CFG.ujet;
    const rows = [
      ['Tenant', u.tenant],
      ['Customer email', s ? s.email : '(leave empty — guest)'],
      ['Customer name', s ? s.name : ''],
      ['DAP / menu key', s ? u.menus.signedIn : u.menus.guest],
      ['Brand colour', u.brandColour],
      ['Chat language', s ? s.chat_language : 'en']
    ];
    const json = JSON.stringify(customData(s), null, 2);
    document.getElementById('chat-mount').innerHTML = `<div class="kit">
      <p class="kit-lead"><b>Live chat comes from the UJET Web SDK Demo Kit.</b> With <code>npm run injector</code> running, press <b>Option+Shift+U</b> on this page and use these values. Re-open the picker after switching persona.</p>
      <table class="kit-t">${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td><code>${esc(v)}</code></td><td><button class="mini" data-copy="${esc(v)}">Copy</button></td></tr>`).join('')}</table>
      <div class="kit-h"><b>Custom data</b> <small>(paste in the picker, tick “Sign it”)</small><button class="mini" id="kit-copy-json">Copy JSON</button></div>
      <pre class="kit-json">${esc(json)}</pre>
      ${CFG.mockChatFallback ? '<button class="btn primary sm" id="kit-backup">Start backup chat (scripted Stitch)</button>' : ''}
    </div>`;
    document.querySelectorAll('#chat-mount [data-copy]').forEach(b => b.onclick = () => copy(b.dataset.copy, b));
    document.getElementById('kit-copy-json').onclick = e => copy(json, e.target);
    const bk = document.getElementById('kit-backup'); if (bk) bk.onclick = () => { document.getElementById('chat-panel').dataset.mode = 'mock'; mountMock(); };
  }

  // ---------- public ----------
  window.Chat = {
    Session,
    async init() { await this.restart(); },
    async restart() {
      const s = Session.get();
      const header = document.getElementById('chat-status');
      if (header) header.textContent = s ? `✔ ${I18N[lang()].signedInVia} #${s.store_id}` : I18N[lang()].chatGuest;
      document.getElementById('chat-panel').classList.toggle('verified', !!s);
      const panel = document.getElementById('chat-panel');
      if (CFG.chatMode === 'demokit' && panel.dataset.mode !== 'mock-forced') { panel.dataset.mode = 'demokit'; mountDemoKit(); return; }
      if (CFG.chatMode === 'embedded') {
        try { await startUjet(s); panel.dataset.mode = 'ujet'; return; }
        catch (e) { console.error('[portal] UJET failed, using backup chat:', e); }
      }
      if (CFG.mockChatFallback || CFG.chatMode === 'mock') { panel.dataset.mode = 'mock'; mountMock(); }
    },
    customData: () => customData(Session.get()),
    backup() { document.getElementById('chat-panel').dataset.mode = 'mock'; mountMock(); },
    ask(text) { const p = document.getElementById('chat-panel'); if (p.dataset.mode === 'demokit' && CFG.mockChatFallback) { p.dataset.mode = 'mock'; mountMock(); setTimeout(() => userSays(text), 600); } else if (p.dataset.mode === 'mock') userSays(text); document.getElementById('chat-panel').classList.add('open'); }
  };
})();

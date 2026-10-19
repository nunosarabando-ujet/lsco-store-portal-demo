/* LS&Co. To Go — hash router and views */
(function () {
  const CFG = window.PORTAL_CONFIG;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let uiLang = 'en';
  let apiState = null;
  let lastCounts = {};

  // ---------- data access (mock or api) ----------
  function data() { return CFG.dataMode === 'api' && apiState ? apiState : DemoData.get(); }
  async function pollApi() {
    if (CFG.dataMode !== 'api') return;
    const s = Chat.Session.get();
    try {
      const tok = sessionStorage.getItem('lsco_portal_token') || '';
      const r = await fetch(`${CFG.apiBase}/portal/summary${s ? '?store=' + s.store_id : ''}`, { headers: tok ? { Authorization: 'Bearer ' + tok } : {} });
      if (r.ok) { apiState = Object.assign({}, DemoData.get(), await r.json()); render(true); }
    } catch (e) { console.warn('[portal] api poll failed', e); }
  }

  const session = () => Chat.Session.get();
  const me = () => { const s = session(); return s ? data().personas[s.persona] || DemoData.get().personas[s.persona] : null; };
  const store = id => data().stores.find(s => s.id === id);
  const L = () => I18N[uiLang];
  const snow = (table, number) => `${CFG.serviceNowBase}/nav_to.do?uri=${table}.do?sysparm_query=number=${encodeURIComponent(number)}`;
  const pt = (o, k) => (uiLang === 'pt' && o[k + 'Pt']) ? o[k + 'Pt'] : o[k];

  function counts() {
    const s = session(); if (!s) return {};
    const D = data();
    return {
      tickets: D.incidents.filter(i => i.storeId === s.store_id && !['Resolved', 'Closed'].includes(i.state)).length,
      orders: D.orders.filter(o => o.storeId === s.store_id && o.active && !o.fm).length,
      approvals: D.approvals.filter(a => a.storeId === s.store_id).length,
      tech: D.incidents.filter(i => i.storeId === s.store_id && i.category !== 'Facilities' && !['Resolved', 'Closed'].includes(i.state)).length,
      ops: (D.opsRequests || []).filter(o => o.storeId === s.store_id).length,
      questions: (D.questions || []).filter(q => q.storeId === s.store_id).length,
      fm: D.orders.filter(o => o.storeId === s.store_id && o.active && o.fm).length
    };
  }

  // ---------- shell ----------
  function shell() {
    const s = session(); const p = me(); const l = L(); const D = data();
    $('#lang-toggle').textContent = uiLang === 'pt' ? 'EN' : 'PT';
    $('#user-area').innerHTML = s && p
      ? `<a href="#/profile" class="circle avatar-c" title="${esc(p.name)} · ${esc(p.role)}">${esc(p.avatar)}</a><button class="circle" id="signout" title="${l.signOut}" aria-label="${l.signOut}">⏻</button>`
      : `<a href="#/login" class="circle" title="${l.signIn}" aria-label="${l.signIn}">→</a>`;
    const so = $('#signout'); if (so) so.onclick = () => { Chat.Session.clear(); location.hash = '#/welcome'; Chat.restart(); };
    const ban = $('#outage-banner');
    const show = D.outage && D.outage.active && (!s || (store(s.store_id) || {}).region === D.outage.region);
    ban.hidden = !show;
    if (show) ban.innerHTML = `<span class="pulse"></span><span>${esc(l.outageBanner)}</span><a href="#/tickets/${esc(D.outage.parent)}">${l.viewIncident} ${esc(D.outage.parent)} →</a>`;
    $('#footer-text').textContent = l.demoFooter;
  }

  // ---------- helpers ----------
  const badge = st => { const k = String(st).toLowerCase(); const c = /resolv|complete|closed|deliver|up\b|in use|online/.test(k) ? 'g' : /hold|await|delay|review|ordered/.test(k) ? 'a' : /critical|down|major|1 -/.test(k) ? 'r' : 'b'; return `<span class="badge ${c}">${esc(st)}</span>`; };
  const crumbs = list => `<nav class="crumbs">${list.map((c, i) => i < list.length - 1 ? `<a href="${c[0]}">${esc(c[1])}</a><span>›</span>` : `<b>${esc(c[1])}</b>`).join('')}</nav>`;
  const empty = () => `<div class="empty">${L().noItems}</div>`;
  const ask = (text) => `<button class="btn ghost sm" data-ask="${esc(text)}">💬 ${L().askStitch}</button>`;
  function table(cols, rows, hrefFn) {
    if (!rows.length) return empty();
    return `<div class="table-wrap"><table><thead><tr>${cols.map(c => `<th>${esc(c[0])}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr class="${r.fresh ? 'fresh' : ''}" data-href="${hrefFn(r)}" tabindex="0">${cols.map(c => `<td>${c[1](r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  // ---------- views ----------
  const V = {};
  V.welcome = () => {
    const l = L();
    return `<section class="hero"><div class="hero-in"><p class="eyebrow">LS&amp;Co. · To Go</p><h1>${l.welcomeTitle}</h1><p class="lead">${l.welcomeLead}</p>
      <div class="hero-cta"><a class="btn primary" href="#/login">${l.signInStaff}</a><a class="btn light" href="#/locations">${l.findStore}</a></div></div></section>
      <section class="grid3">${[['📍', l.locations, '#/locations'], ['💬', 'Stitch', '#/locations'], ['📘', l.kb, '#/login']].map(([i, t, h]) => `<a class="tile" href="${h}"><span class="ti">${i}</span><b>${esc(t)}</b></a>`).join('')}</section>`;
  };
  V.locations = () => {
    const l = L(); const D = data();
    const groups = {}; D.stores.forEach(s => (groups[s.region] = groups[s.region] || []).push(s));
    return crumbs([['#/welcome', 'To Go'], ['', l.locations]]) + `<h1>${l.locations}</h1>` + Object.keys(groups).map(g => `<h2 class="h2">${esc(g)}</h2><div class="cards">${groups[g].map(s => `<a class="store-card" href="#/locations/${s.id}"><div class="sc-top"><b>#${s.id} ${esc(s.name)}</b>${s.status === 'down' ? badge('Down') : ''}</div><div class="muted">${esc(s.address)}</div><div class="muted sm">${esc(s.hours)}</div></a>`).join('')}</div>`).join('');
  };
  V.location = id => {
    const l = L(); const s = store(id); if (!s) return V.notfound();
    return crumbs([['#/welcome', 'To Go'], ['#/locations', l.locations], ['', '#' + s.id]]) + `<h1>#${s.id} ${esc(s.name)}</h1>
      <div class="panel kv">${[[l.location, s.address], [l.hours, s.hours], [l.phone, s.phone], [l.manager, s.manager], [l.region, s.region]].map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>
      <p>${ask(uiLang === 'pt' ? `Qual é o horário da loja #${s.id}?` : `What are the hours for store #${s.id}?`)}</p>`;
  };
  V.login = () => {
    const l = L(); const P = DemoData.get().personas;
    return `<div class="login-wrap"><div class="login-card"><div class="login-logo"><span class="logo"><span class="logo-ls">LS<br>&amp;CO.</span><span class="togo">TO GO »</span></span></div><h1>${l.signInTitle}</h1><p class="muted">${l.signInLead}</p>
      ${Object.values(P).map(p => `<button class="persona" data-persona="${p.id}"><span class="avatar lg">${p.avatar}</span><span><b>${l.continueAs} ${esc(p.name)}</b><small>${esc(p.role)} · #${p.storeId} ${esc(store(p.storeId).name)} · ${p.language === 'pt' ? 'Português (PT)' : 'English'}</small></span><span class="arrow">→</span></button>`).join('')}
      <p class="sso-note">🔒 SSO · Microsoft Entra ID <em>(simulated for demo)</em></p></div></div>`;
  };
  V.home = () => {
    const l = L(); const p = me(); const c = counts(); const st = store(p.storeId);
    const hub = [['tech', '#/support/it', 'red'], ['ops', '#/ops', 'red'], ['hss', '#/support/hss', 'red'], ['itauto', '#/it', 'red'], ['fac', '#/support/facilities', 'blue'], ['dm', '#/support/dm', 'dm'], ['fm', '#/fixtures', 'grey']];
    const box = (k, label, href, live) => `<a class="ocount ${live ? 'live' : ''} ${lastCounts[k] != null && c[k] > lastCounts[k] ? 'bump' : ''}" href="${href}"><b>${c[k]}</b><span>${esc(label)}${live ? ` <em>● ${l.updatedLive}</em>` : ''}</span></a>`;
    return `<section class="greet"><p>${l.hello}, ${esc(p.name)}</p><h1>${l.whatSupport}</h1></section>
      <form class="hsearch" id="home-search"><input id="home-search-input" type="search" placeholder="${uiLang === 'pt' ? 'Pesquisar' : 'Search'}" aria-label="Search"></form>
      <section class="hub">${hub.map(([k, h, tone]) => `<a class="hub-card ${tone}" href="${h}"><span class="hub-dot"></span><span class="hub-txt"><b>${esc(l.hub[k][0])}</b><small>${esc(l.hub[k][1])}</small></span><span class="hub-chev">›</span></a>`).join('')}</section>
      <h2 class="oi-title">${l.openItemsStore} #${esc(st.id)}${st.status === 'down' ? ` <span class="badge r">${l.offline}</span>` : ''}</h2>
      <section class="ogrid">${box('tech', l.techIssues, '#/tickets')}${box('ops', l.opsReq, '#/ops')}${box('questions', l.questions, '#/tickets')}${box('orders', l.hwOrders, '#/orders', true)}</section>
      ${awaitingCard()}`;
  };
  V.ops = () => {
    const l = L(); const s = session(); const rows = (data().opsRequests || []).filter(o => o.storeId === s.store_id);
    return crumbs([['#/home', l.home], ['', l.opsTitle]]) + `<h1>${l.opsTitle}</h1>` +
      table([[l.number, r => `<b>${esc(r.number)}</b>`], [l.summary, r => esc(r.short)], [l.team, r => esc(r.team)], [l.state, r => badge(r.state)], [l.opened, r => esc(r.opened)]], rows, () => '#/ops');
  };
  V.itauto = () => {
    const l = L(); const items = [['📦', l.orders, '#/orders'], ['📱', l.devices, '#/devices'], ['🎫', l.tickets, '#/tickets'], ['📶', l.store, '#/store'], ['📘', l.kb, '#/kb']];
    return crumbs([['#/home', l.home], ['', l.hub.itauto[0]]]) + `<h1>${l.hub.itauto[0]}</h1><p class="muted">${l.hub.itauto[1]}</p>
      <div class="cards">${items.map(([i, t, h]) => `<a class="tile" href="${h}"><span class="ti">${i}</span><b>${esc(t)}</b></a>`).join('')}</div>`;
  };
  function awaitingCard() {
    const s = session(); const i = data().incidents.find(x => x.storeId === s.store_id && x.holdReason === 'Awaiting Caller');
    if (!i) return '';
    return `<a class="callout" href="#/tickets/${i.number}"><b>${L().awaiting}: ${esc(i.number)}</b><span>${esc(i.task || i.short)}</span></a>`;
  }
  V.support = cat => {
    const l = L(); const map = {
      it: { t: l.hub.tech[0], items: uiLang === 'pt' ? ['A caixa 2 está bloqueada', 'Erro E-204 no terminal de pagamento', 'Não consigo entrar no iPad', 'Wi-Fi do armazém em baixo'] : ['Till 2 is frozen', 'Card reader says E-204', 'I can\'t log in to the iPad', 'Stockroom Wi-Fi is down'] },
      facilities: { t: l.hub.fac[0], items: uiLang === 'pt' ? ['O estore está encravado', 'Luz do provador avariada', 'Ar condicionado não funciona'] : ['Roller shutter is stuck', 'Fitting room light is out', 'HVAC not cooling'] },
      hss: { t: l.hub.hss[0], items: uiLang === 'pt' ? ['Cliente escorregou na entrada', 'Porta de emergência bloqueada'] : ['Customer slipped at the entrance', 'Fire exit is blocked by stock'] },
      dm: { t: l.hub.dm[0], items: uiLang === 'pt' ? ['Pedir visita do District Manager', 'Estado do meu pedido ao DM'] : ['Request a District Manager visit', 'Status of my DM ticket'] },
      hr: { t: l.tiles.hr[0], items: uiLang === 'pt' ? ['Dúvida sobre o meu recibo'] : ['Question about my payslip'] }
    };
    const m = map[cat] || map.it;
    return crumbs([['#/home', L().home], ['', m.t]]) + `<h1>${esc(m.t)}</h1><p class="muted">${cat === 'it' ? '' : (uiLang === 'pt' ? 'Este pedido não é tratado pela informática. O Stitch encaminha-o para a equipa certa.' : 'This isn\'t handled by the IT desk. Stitch will route it to the right team.')}</p>
      <div class="quick">${m.items.map(x => `<button class="quick-btn" data-ask="${esc(x)}"><span>💬</span>${esc(x)}</button>`).join('')}</div>
      <h2 class="h2">${l.kb}</h2><div class="cards">${data().kb.filter(k => cat === 'facilities' ? k.cat === 'Facilities' : cat === 'it' ? k.cat !== 'Facilities' : false).map(kbCard).join('') || empty()}</div>`;
  };
  V.tickets = () => {
    const l = L(); const s = session(); const rows = data().incidents.filter(i => i.storeId === s.store_id || (i.major && data().outage.active && store(s.store_id).region === 'NYC'));
    return crumbs([['#/home', L().home], ['', l.tickets]]) + `<div class="h-row"><h1>${l.tickets}</h1>${ask(uiLang === 'pt' ? 'Estado dos meus pedidos' : 'Status of my tickets')}</div>` +
      table([[l.number, r => `<b>${esc(r.number)}</b>${r.major ? ' <span class="badge r">MAJOR</span>' : ''}${r.parent ? ` <small class="muted">↳ ${esc(r.parent)}</small>` : ''}`], [l.summary, r => esc(pt(r, 'short'))], [l.state, r => badge(r.holdReason ? `${r.state} · ${r.holdReason}` : r.state)], [l.priority, r => esc(r.priority)], [l.updated, r => esc(r.updated)]], rows, r => '#/tickets/' + r.number);
  };
  V.ticket = n => {
    const l = L(); const i = data().incidents.find(x => x.number === n); if (!i) return V.notfound();
    const parent = i.parent ? data().incidents.find(x => x.number === i.parent) : null;
    const children = data().incidents.filter(x => x.parent === i.number);
    return crumbs([['#/home', L().home], ['#/tickets', l.tickets], ['', i.number]]) + `<div class="h-row"><h1>${esc(i.number)} ${i.major ? '<span class="badge r">MAJOR INCIDENT</span>' : ''}</h1><a class="btn ghost sm" target="_blank" rel="noopener" href="${snow('incident', i.number)}">↗ ${l.openInSnow}</a></div>
      <p class="lead">${esc(pt(i, 'short'))}</p>
      <div class="panel kv">${[[l.state, badge(i.holdReason ? `${i.state} · ${i.holdReason}` : i.state)], [l.priority, esc(i.priority)], [l.category, esc(i.category)], [l.assignment, esc(i.assignment)], [l.opened, esc(i.opened)], [l.updated, esc(i.updated)], [l.parentInc, parent ? `<a href="#/tickets/${parent.number}">${esc(parent.number)}</a>` : '—']].map(([k, v]) => `<div><span>${esc(k)}</span><b>${v}</b></div>`).join('')}</div>
      ${i.task ? `<div class="callout static"><b>${l.awaiting}</b><span>${esc(i.task)}</span></div>` : ''}
      ${children.length ? `<h2 class="h2">Child incidents</h2>` + table([[l.number, r => esc(r.number)], [l.summary, r => esc(r.short)], [l.state, r => badge(r.state)]], children, r => '#/tickets/' + r.number) : ''}
      <h2 class="h2">${l.activity}</h2><ol class="timeline">${i.notes.map(nn => `<li><div class="tl-h"><b>${esc(nn.by)}</b><small>${esc(nn.at)}</small></div><p>${esc(pt(nn, 'text'))}</p></li>`).join('')}</ol>
      <p>${ask((uiLang === 'pt' ? 'Estado do ' : 'Status of ') + i.number)}</p>`;
  };
  V.orders = () => {
    const l = L(); const s = session(); const D = data();
    const rows = D.orders.filter(o => o.storeId === s.store_id && !o.fm);
    const appr = D.approvals.filter(a => a.storeId === s.store_id);
    return crumbs([['#/home', L().home], ['', l.orders]]) + `<div class="h-row"><h1>${l.orders}</h1>${ask(uiLang === 'pt' ? 'O ecrã do iPad partiu-se' : 'My iPad screen is broken')}</div>` +
      table([[l.number, r => `<b>${esc(r.number)}</b>${r.fresh ? ' <span class="badge g">NEW</span>' : ''}`], [l.item, r => esc(pt(r, 'item'))], [l.serial, r => esc(r.serial || '—')], [l.stage, r => badge(r.stage)], [l.eta, r => esc(r.eta)]], rows, r => '#/orders/' + r.number) +
      (appr.length ? `<h2 class="h2">${l.pendingApprovals}</h2>` + appr.map(a => `<div class="panel row"><b>${esc(a.number)}</b><span>${esc(a.what)}</span><small class="muted">${esc(a.waitingOn)} · ${esc(a.since)}</small></div>`).join('') : '');
  };
  V.order = n => {
    const l = L(); const o = data().orders.find(x => x.number === n); if (!o) return V.notfound();
    const back = o.fm ? ['#/fixtures', l.tiles.fm[0]] : ['#/orders', l.orders];
    return crumbs([['#/home', L().home], back, ['', o.number]]) + `<div class="h-row"><h1>${esc(o.number)}</h1><a class="btn ghost sm" target="_blank" rel="noopener" href="${snow('sc_req_item', o.number)}">↗ ${l.openInSnow}</a></div>
      <p class="lead">${esc(pt(o, 'item'))}</p>
      <div class="stages">${['Requested', 'Approved', o.stage === 'Delayed at vendor' ? 'Delayed at vendor' : 'Fulfillment', 'Shipped', 'Delivered'].map((st, idx, arr) => { const cur = arr.indexOf(o.stage === 'Closed Complete' ? 'Delivered' : o.stage); return `<div class="stage ${idx <= (cur < 0 ? 2 : cur) ? 'done' : ''} ${st === 'Delayed at vendor' ? 'delay' : ''}">${esc(st)}</div>`; }).join('')}</div>
      <div class="panel kv">${[[l.state, badge(o.state)], [l.requestedFor, esc(o.requestedFor)], [l.serial, esc(o.serial || '—')], [l.eta, esc(o.eta)], [l.tracking, esc(o.tracking || '—')], [l.assignment, esc(o.assignment)], [l.opened, esc(o.opened)]].map(([k, v]) => `<div><span>${esc(k)}</span><b>${v}</b></div>`).join('')}</div>
      <p>${ask((uiLang === 'pt' ? 'Onde está a encomenda ' : 'Where is order ') + o.number + '?')}</p>`;
  };
  V.devices = () => {
    const l = L(); const s = session(); const rows = data().devices.filter(d => d.storeId === s.store_id);
    return crumbs([['#/home', L().home], ['', l.devices]]) + `<h1>${l.devices}</h1>` +
      table([[l.item, r => `<b>${esc(r.name)}</b>`], [l.model, r => esc(r.model)], [l.serial, r => `<code>${esc(r.serial)}</code>`], [l.status, r => badge(r.status)], [l.replacements90, r => r.network ? '—' : (r.replacements90d ? `<span class="badge a">${r.replacements90d}</span>` : '0')]], rows, r => '#/devices/' + r.serial);
  };
  V.device = serial => {
    const l = L(); const d = data().devices.find(x => x.serial === serial); if (!d) return V.notfound();
    return crumbs([['#/home', L().home], ['#/devices', l.devices], ['', d.name]]) + `<div class="h-row"><h1>${esc(d.name)}</h1><a class="btn ghost sm" target="_blank" rel="noopener" href="${CFG.serviceNowBase}/nav_to.do?uri=cmdb_ci_list.do?sysparm_query=serial_number=${encodeURIComponent(d.serial)}">↗ ${l.openInSnow}</a></div>
      <div class="panel kv">${[[l.model, d.model], [l.serial, d.serial], [l.status, d.status], [l.location, d.location], [l.warranty, d.warranty], [l.replacements90, d.network ? '—' : String(d.replacements90d)]].map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>
      ${d.network ? '' : `<p>${ask(uiLang === 'pt' ? `O ecrã do ${d.name} partiu-se, preciso de substituição` : `The ${d.name} screen is broken, I need a replacement`)}</p>`}`;
  };
  const kbCard = k => `<a class="kb-card" href="#/kb/${k.id}"><small>${esc(k.cat)} · ${esc(k.id)}</small><b>${esc(pt(k, 'title'))}</b><span class="muted sm">${k.views} views</span></a>`;
  V.kb = () => crumbs([['#/home', L().home], ['', L().kb]]) + `<h1>${L().kb}</h1><div class="cards">${data().kb.map(kbCard).join('')}</div>`;
  V.kbArticle = id => {
    const k = data().kb.find(x => x.id === id); if (!k) return V.notfound();
    return crumbs([['#/home', L().home], ['#/kb', L().kb], ['', k.id]]) + `<article class="article"><small class="muted">${esc(k.cat)} · ${esc(k.id)}</small><h1>${esc(pt(k, 'title'))}</h1><ol>${k.body.map(b => `<li>${esc(b)}</li>`).join('')}</ol></article><p>${ask(pt(k, 'title'))}</p>`;
  };
  V.store = () => {
    const l = L(); const s = store(session().store_id); const D = data();
    const net = D.devices.filter(d => d.storeId === s.id && d.network);
    const region = D.stores.filter(x => x.region === s.region);
    return crumbs([['#/home', L().home], ['', l.store]]) + `<h1>#${s.id} ${esc(s.name)}</h1>
      <div class="panel kv">${[[l.location, s.address], [l.hours, s.hours], [l.phone, s.phone], [l.manager, s.manager], [l.region, s.region], ['Circuit', s.circuit], ['LTE backup', s.lte ? '✓' : '✗']].map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>
      <h2 class="h2">${l.storeHealth}</h2><div class="cards">${net.map(d => `<a class="store-card" href="#/devices/${d.serial}"><div class="sc-top"><b>${esc(d.name)}</b>${badge(d.status)}</div><div class="muted sm">${esc(d.model)}</div></a>`).join('')}</div>
      <h2 class="h2">${l.region}: ${esc(s.region)}</h2><div class="cards">${region.map(x => `<div class="store-card"><div class="sc-top"><b>#${x.id} ${esc(x.name)}</b>${badge(x.status === 'down' ? 'Down' : 'Online')}</div><div class="muted sm">${esc(x.circuit)}</div></div>`).join('')}</div>`;
  };
  V.fixtures = () => {
    const l = L(); const s = session(); const D = data();
    const rows = D.orders.filter(o => o.storeId === s.store_id && o.fm);
    return crumbs([['#/home', L().home], ['', l.tiles.fm[0]]]) + `<div class="h-row"><h1>${l.tiles.fm[0]}</h1>${ask(uiLang === 'pt' ? 'Onde está o meu kit de Natal?' : 'What do I need for the Holiday windows?')}</div><p class="muted">${l.fmLead}</p>` +
      table([[l.number, r => `<b>${esc(r.number)}</b>`], [l.item, r => esc(pt(r, 'item'))], [l.stage, r => badge(r.stage)], [l.eta, r => esc(r.eta)]], rows, r => '#/orders/' + r.number) +
      `<h2 class="h2">${l.catalog}</h2><div class="cards">${D.fixtures.map(f => `<div class="fx-card"><div class="fx-img">${f.img}</div><b>${esc(f.name)}</b><small class="muted">${esc(f.sku)} · ${s.store_id === '415' ? '€' : '$'}${f.cost}</small><button class="btn ghost sm" data-ask="${esc((uiLang === 'pt' ? 'Quero encomendar ' : 'I want to order ') + f.name)}">${l.addToCart}</button></div>`).join('')}</div>`;
  };
  V.profile = () => {
    const l = L(); const p = me(); const s = session();
    return crumbs([['#/home', L().home], ['', l.profile]]) + `<div class="h-row"><h1>${esc(p.name)}</h1></div>
      <div class="panel kv">${[[l.employeeId, p.employeeId], [l.role, p.role], ['Store', '#' + p.storeId + ' ' + store(p.storeId).name], ['Email', p.email], [l.mobile, p.mobileMasked], [l.profileLang, s.language === 'pt' ? 'Português (Portugal)' : 'English'], ['Sign-in', s.sso_method + ' · ' + s.signed_in_at.replace('T', ' ').slice(0, 16)]].map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>`;
  };
  V.search = q => {
    const D = data(); const s = session(); const t = (q || '').toLowerCase();
    const hit = x => JSON.stringify(x).toLowerCase().includes(t);
    const inc = s ? D.incidents.filter(i => i.storeId === s.store_id && hit(i)) : [];
    const ord = s ? D.orders.filter(o => o.storeId === s.store_id && hit(o)) : [];
    const kb = D.kb.filter(hit);
    return `<h1>Search: “${esc(q)}”</h1>` + (inc.length ? `<h2 class="h2">${L().tickets}</h2>` + inc.map(i => `<a class="result" href="#/tickets/${i.number}"><b>${i.number}</b> ${esc(i.short)}</a>`).join('') : '') +
      (ord.length ? `<h2 class="h2">${L().orders}</h2>` + ord.map(o => `<a class="result" href="#/orders/${o.number}"><b>${o.number}</b> ${esc(o.item)}</a>`).join('') : '') +
      (kb.length ? `<h2 class="h2">${L().kb}</h2><div class="cards">${kb.map(kbCard).join('')}</div>` : '') + (!inc.length && !ord.length && !kb.length ? empty() : '');
  };
  V.notfound = () => `<h1>Not found</h1><p><a href="#/home">← ${L().back}</a></p>`;

  // ---------- router ----------
  const PUBLIC = ['welcome', 'locations', 'login'];
  function route() {
    const h = location.hash.replace(/^#\/?/, '') || (session() ? 'home' : 'welcome');
    const [path, query] = h.split('?'); const parts = path.split('/').map(decodeURIComponent);
    const root = parts[0] === '' ? 'home' : parts[0];
    if (!PUBLIC.includes(root) && !session()) { location.hash = '#/login'; return null; }
    if (root === 'login' && session()) { location.hash = '#/home'; return null; }
    const r = {
      welcome: () => V.welcome(), locations: () => parts[1] ? V.location(parts[1]) : V.locations(), login: () => V.login(), home: () => V.home(),
      support: () => V.support(parts[1]), tickets: () => parts[1] ? V.ticket(parts[1]) : V.tickets(), orders: () => parts[1] ? V.order(parts[1]) : V.orders(),
      devices: () => parts[1] ? V.device(parts[1]) : V.devices(), kb: () => parts[1] ? V.kbArticle(parts[1]) : V.kb(), store: () => V.store(), fixtures: () => V.fixtures(),
      profile: () => V.profile(), ops: () => V.ops(), it: () => V.itauto(), search: () => V.search(new URLSearchParams(query || '').get('q'))
    }[root];
    return r ? r() : V.notfound();
  }
  function render(keepScroll) {
    const html = route(); if (html == null) return;
    const y = window.scrollY;
    const root = (location.hash.replace(/^#\/?/, '').split(/[/?]/)[0]) || 'home';
    const bare = ['home', 'login', 'welcome', ''].includes(root);
    $('#view').innerHTML = bare ? html : `<div class="sheet">${html}</div>`;
    $('#view').dataset.root = root; shell();
    const hs = $('#home-search'); if (hs) hs.onsubmit = e => { e.preventDefault(); location.hash = '#/search?q=' + encodeURIComponent($('#home-search-input').value); };
    lastCounts = counts();
    if (!keepScroll) window.scrollTo(0, 0); else window.scrollTo(0, y);
    fitChat();
  }

  // ---------- events ----------
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-ask]'); if (a) { Chat.ask(a.dataset.ask); return; }
    const p = e.target.closest('[data-persona]');
    if (p) { const per = DemoData.get().personas[p.dataset.persona]; Chat.Session.set(per); setLang(per.language, true); location.hash = '#/home'; Chat.restart(); return; }
    const tr = e.target.closest('tr[data-href]'); if (tr && !e.target.closest('a')) location.hash = tr.dataset.href;
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches('tr[data-href]')) location.hash = e.target.dataset.href;
    if (e.shiftKey && (e.key === 'P' || e.key === 'p') && !e.target.matches('input,textarea')) togglePresenter();
  });
  window.addEventListener('hashchange', () => render());
  window.addEventListener('storage', e => { if (e.key === 'lsco_demo_state_v2') { DemoData.reload(); render(true); } });

  function setLang(l, silent) {
    uiLang = l; document.documentElement.lang = l === 'pt' ? 'pt-PT' : 'en';
    try { localStorage.setItem('lsco_ui_lang', l); } catch (e) {}
    if (!silent) { render(true); Chat.restart(); }
  }

  // ---------- presenter panel (Shift+P) ----------
  function togglePresenter() { const p = $('#presenter'); p.hidden = !p.hidden; if (!p.hidden) drawPresenter(); }
  function drawPresenter() {
    const s = session(); const D = DemoData.get();
    $('#presenter-body').innerHTML = `
      <p class="muted sm">Data: <b>${CFG.dataMode}</b> · Chat: <b>${$('#chat-panel').dataset.mode || '—'}</b></p>
      <h4>Persona</h4><div class="pbtns">${Object.values(D.personas).map(p => `<button data-p-persona="${p.id}" class="${s && s.persona === p.id ? 'on' : ''}">${esc(p.name)} (#${p.storeId})</button>`).join('')}<button data-p="signout">Sign out (guest)</button></div>
      <h4>Simulate (mock mode)</h4><div class="pbtns">
        <button data-p="outage">${D.outage.active ? 'End NYC outage' : 'UC 1a · NYC outage'}</button>
        <button data-p="order">UC 2a · iPad order (#322 Till 2)</button>
        <button data-p="outbound">UC 3.1 · outbound follow-up done</button>
        <button data-p="facilities">UC 3.2 · shutter → Facilities</button></div>
      <h4>Chat</h4><div class="pbtns"><button data-p="panel">${document.body.classList.contains('no-panel') ? 'Show side panel' : 'Hide side panel (full width)'}</button><button data-p="kit">Demo Kit values</button><button data-p="backup">Backup chat</button></div>
      <h4>Reset</h4><div class="pbtns"><button data-p="reset" class="danger">Reset seed data</button></div>`;
  }
  $('#presenter').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.pPersona) { const per = DemoData.get().personas[b.dataset.pPersona]; Chat.Session.set(per); setLang(per.language, true); location.hash = '#/home'; render(); Chat.restart(); }
    const a = b.dataset.p;
    if (a === 'signout') { Chat.Session.clear(); location.hash = '#/welcome'; Chat.restart(); }
    if (a === 'outage') DemoData.get().outage.active ? DemoData.endOutage() : DemoData.startOutage();
    if (a === 'order') DemoData.createIpadOrder('322', 'DMPXLS322001', 'Broken screen', 'Amanda Scarpin');
    if (a === 'outbound') DemoData.resolveAwaitingInfo();
    if (a === 'facilities') DemoData.createFacilities(session() ? session().store_id : '322', 'Roller shutter stuck half-open at store entrance');
    if (a === 'reset') { DemoData.reset(); Chat.restart(); }
    if (a === 'panel') document.body.classList.toggle('no-panel');
    if (a === 'kit') { $('#chat-panel').dataset.mode = ''; Chat.restart(); }
    if (a === 'backup') Chat.backup();
    if (a === 'close') { $('#presenter').hidden = true; return; }
    render(true); drawPresenter();
  });

  // ---------- boot ----------
  window.App = {
    lang: () => uiLang,
    refresh(bump) { render(true); },
    setLang
  };
  function fitChat() {
    const c = $('#chat-panel'); if (getComputedStyle(c).position !== 'sticky') { c.style.height = ''; return; }
    const top = Math.max(c.getBoundingClientRect().top, 16);
    c.style.height = (window.innerHeight - top - 26) + 'px';
  }
  function boot() {
    window.addEventListener('scroll', fitChat, { passive: true }); window.addEventListener('resize', fitChat);
    const s = session();
    let l = 'en'; try { l = localStorage.getItem('lsco_ui_lang') || (s ? s.language : 'en'); } catch (e) {}
    setLang(l, true);
    $('#lang-toggle').onclick = () => setLang(uiLang === 'pt' ? 'en' : 'pt');
    $('#chat-toggle').onclick = () => $('#chat-panel').classList.toggle('open');
    $('#chat-close').onclick = () => $('#chat-panel').classList.remove('open');
    render();
    Chat.init();
    if (CFG.dataMode === 'api') { pollApi(); setInterval(pollApi, CFG.pollMs); }
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();

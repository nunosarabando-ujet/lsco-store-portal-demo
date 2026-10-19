// Small UI dictionary. Data content stays as stored (except KB articles that have a pt version).
import { state } from "./state.js";

const D = {
  en: {
    search: "Search", searchPh: "Search tickets, orders, devices, articles…",
    hello: "Hello, {name}", whatSupport: "What support do you need?",
    openItems: "Open Items – Store #{id}",
    cTech: "Open Tech Support Issues", cOps: "Open Ops Support Requests", cQ: "Questions", cHw: "Open Hardware Orders", updatedLive: "updated live",
    home: "Home", myTickets: "My Tickets", orders: "Hardware Orders", devices: "Store Devices", kb: "Knowledge", store: "Store Status",
    profile: "Profile", searchRes: "Search", signOut: "Sign out", signIn: "Sign in", storeChip: "Store #{id}",
    welcome: "Welcome", locations: "Store Locations",
    outage: "Known issue: network outage affecting your region — {num}. Updates every 15 min.",
    outagePublic: "Known issue: network outage affecting {n} stores in {region}. Updates every 15 min.",
    chatAbout: "Chat with Stitch about this", askTicket: "Ask Stitch about this ticket", openSnow: "Open in ServiceNow", mockRecord: "Mock record",
    commonRequests: "Common requests", relatedKb: "Related articles", owningTeam: "Handled by", notIt: "This isn't handled by Store IT. Stitch routes it to {team} so it never waits in the IT queue.",
    externalPortal: "Open {team} portal", allOpen: "All open", onHold: "On Hold", resolved: "Resolved", allTypes: "All types",
    tech: "Tech", ops: "Ops", question: "Question", filterText: "Filter…",
    number: "Number", shortDesc: "Short description", state: "State", priority: "Priority", category: "Category", updated: "Updated",
    opened: "Opened", assignment: "Assignment group", ci: "Configuration item", caller: "Caller", storeL: "Store",
    parent: "Parent incident", children: "Child incidents", timeline: "Activity", internal: "Internal", holdReason: "Hold reason",
    item: "Item", serial: "Serial", stage: "Stage", eta: "ETA", shipTo: "Ship to", tracking: "Tracking", returnLabel: "Return label",
    download: "Download (placeholder)", name: "Name", type: "Type", status: "Status", location: "Location", warranty: "Warranty end",
    openTickets: "Open tickets for this device", repl90: "Replacements used in last 90 days (store)", replPolicy: "Policy: 1 per store per 90 days",
    health: "Network health", activeOutage: "Active outage", affected: "Regional stores affected", none: "None",
    lang: "Language", method: "Sign-in method", employeeId: "Employee ID", role: "Role", email: "Email", mobile: "Registered mobile",
    noResults: "No results.", nothing: "Nothing here yet.", notFound: "Page not found", backHome: "Back to Home",
    signingIn: "Signing in with Microsoft Entra ID…", chooseAccount: "Pick an account", signInSub: "Simulated Microsoft Entra ID sign-in",
    welcomeTitle: "Store support, wherever you are", welcomeSub: "Sign in to raise and track tickets, order hardware and check your store. Anyone can look up store locations and opening hours, and ask Stitch about them.",
    findStore: "Find a store", hours: "Hours", phone: "Phone", address: "Address", region: "Region",
    data: "Data", lastRefresh: "Last refreshed", fixtures: "Catalogue", alloc: "Holiday allocation remaining"
  },
  pt: {
    search: "Pesquisar", searchPh: "Pesquisar pedidos, encomendas, equipamentos, artigos…",
    hello: "Olá, {name}", whatSupport: "De que apoio precisa?",
    openItems: "Itens em aberto – Loja #{id}",
    cTech: "Problemas técnicos em aberto", cOps: "Pedidos operacionais em aberto", cQ: "Perguntas", cHw: "Encomendas de hardware em aberto", updatedLive: "atualizado em tempo real",
    home: "Início", myTickets: "Os meus pedidos", orders: "Encomendas de hardware", devices: "Equipamentos da loja", kb: "Conhecimento", store: "Estado da loja",
    profile: "Perfil", searchRes: "Pesquisa", signOut: "Terminar sessão", signIn: "Iniciar sessão", storeChip: "Loja #{id}",
    welcome: "Bem-vindo", locations: "Lojas",
    outage: "Problema conhecido: falha de rede na sua região — {num}. Atualizações a cada 15 min.",
    outagePublic: "Problema conhecido: falha de rede em {n} lojas na região {region}. Atualizações a cada 15 min.",
    chatAbout: "Falar com o Stitch sobre isto", askTicket: "Perguntar ao Stitch sobre este pedido", openSnow: "Abrir no ServiceNow", mockRecord: "Registo simulado",
    commonRequests: "Pedidos frequentes", relatedKb: "Artigos relacionados", owningTeam: "Tratado por", notIt: "Este assunto não é tratado pela equipa de TI. O Stitch encaminha-o para {team}, sem esperar na fila de TI.",
    externalPortal: "Abrir portal de {team}", allOpen: "Todos em aberto", onHold: "Em espera", resolved: "Resolvidos", allTypes: "Todos os tipos",
    tech: "Técnico", ops: "Operacional", question: "Pergunta", filterText: "Filtrar…",
    number: "Número", shortDesc: "Descrição", state: "Estado", priority: "Prioridade", category: "Categoria", updated: "Atualizado",
    opened: "Aberto", assignment: "Grupo responsável", ci: "Item de configuração", caller: "Requerente", storeL: "Loja",
    parent: "Incidente principal", children: "Incidentes associados", timeline: "Atividade", internal: "Interno", holdReason: "Motivo de espera",
    item: "Artigo", serial: "N.º de série", stage: "Fase", eta: "Previsão", shipTo: "Entregar em", tracking: "Seguimento", returnLabel: "Etiqueta de devolução",
    download: "Descarregar (simulado)", name: "Nome", type: "Tipo", status: "Estado", location: "Localização", warranty: "Fim da garantia",
    openTickets: "Pedidos em aberto deste equipamento", repl90: "Substituições nos últimos 90 dias (loja)", replPolicy: "Política: 1 por loja a cada 90 dias",
    health: "Estado da rede", activeOutage: "Falha ativa", affected: "Lojas da região afetadas", none: "Nenhuma",
    lang: "Idioma", method: "Método de autenticação", employeeId: "N.º de colaborador", role: "Função", email: "Email", mobile: "Telemóvel registado",
    noResults: "Sem resultados.", nothing: "Ainda não há nada aqui.", notFound: "Página não encontrada", backHome: "Voltar ao início",
    signingIn: "A iniciar sessão com o Microsoft Entra ID…", chooseAccount: "Escolha uma conta", signInSub: "Início de sessão Microsoft Entra ID simulado",
    welcomeTitle: "Suporte às lojas, onde estiver", welcomeSub: "Inicie sessão para abrir e acompanhar pedidos, encomendar hardware e ver o estado da loja. Qualquer pessoa pode consultar lojas e horários e perguntar ao Stitch.",
    findStore: "Encontrar uma loja", hours: "Horário", phone: "Telefone", address: "Morada", region: "Região",
    data: "Dados", lastRefresh: "Última atualização", fixtures: "Catálogo", alloc: "Orçamento de Natal disponível"
  }
};

export function t(key, vars) {
  let s = (D[state.lang] && D[state.lang][key]) || D.en[key] || key;
  if (vars) for (const k in vars) s = s.split(`{${k}}`).join(vars[k]);
  return s;
}

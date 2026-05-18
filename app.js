// ============================================================
// IA SGI — Transporte Griffouliere
// Motor: JSON knowledge base + Claude API fallback
// ============================================================

const CLAUDE_API = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-4-20250514";

// Chips por sector
const SECTOR_CHIPS = {
  SI: [
    { label: "Hallazgos y NC",         q: "¿Cuál es el procedimiento ante un hallazgo o no conformidad?" },
    { label: "Auditorías internas",     q: "¿Cómo funciona la auditoría interna del SGI?" },
    { label: "Gestión del cambio",      q: "¿Cómo se gestiona un cambio en el SGI?" },
    { label: "Codificación documentos", q: "¿Cómo se codifican los documentos del SGI?" },
    { label: "Conservación registros",  q: "¿Cuánto tiempo se conservan los registros del SGI?" },
    { label: "Documentos vencidos",     q: "¿Cuáles son los procedimientos de seguridad vencidos?" },
  ],
  SE: [
    { label: "Investigación accidentes", q: "¿Cuál es el proceso de investigación de accidentes e incidentes?" },
    { label: "Camión varado / enclavado",q: "¿Qué hago si el camión se enclava o queda varado en ruta?" },
    { label: "Derrame",                  q: "¿Cómo se gestiona un derrame de hidrocarburo?" },
    { label: "EPP por puesto",           q: "¿Qué EPP se requiere según el puesto de trabajo?" },
    { label: "Espacio confinado",        q: "¿Cuál es el procedimiento de trabajo en espacio confinado?" },
    { label: "Incendio",                 q: "¿Qué hago ante un incendio?" },
    { label: "Alcohol y drogas",         q: "¿Cómo se aplica el control de alcohol y drogas?" },
  ],
  OP: [
    { label: "Plan de Viaje",           q: "¿Cómo se gestiona el Plan de Viaje?" },
    { label: "Conductas de manejo",     q: "¿Cómo se controlan las conductas de manejo?" },
    { label: "YPF Ruta",                q: "¿Cómo se usan las tarjetas YPF Ruta?" },
    { label: "Paradas de descanso",     q: "¿Qué consideraciones debo tener en la parada de descanso?" },
    { label: "Multas",                  q: "¿Cómo se gestionan las multas por infracción?" },
  ],
  SV: [
    { label: "Conducción segura",       q: "¿Cuál es el procedimiento de conducción segura de vehículos?" },
    { label: "Manejo invernal",         q: "¿Cuál es el procedimiento de manejo invernal?" },
    { label: "Mapa de riesgo",          q: "¿Cómo funciona el mapa de riesgo en caminos?" },
  ],
  MA: [
    { label: "Derrame ambiental",       q: "¿Cómo gestionamos un derrame con impacto ambiental?" },
    { label: "Requisitos legales",      q: "¿Cuáles son los requisitos legales ambientales aplicables?" },
  ],
  TA: [
    { label: "📂 Pendiente de carga",   q: "Procedimientos de taller aún no cargados" },
  ],
  ADM: [
    { label: "Compras",                 q: "¿Cómo se gestiona la compra de materiales y servicios?" },
    { label: "Evaluación proveedores",  q: "¿Cómo se evalúan los proveedores?" },
  ],
  RRHH: [
    { label: "📂 Pendiente de carga",   q: "Procedimientos de RRHH aún no cargados" },
  ],
};

// Tag por sector
const SECTOR_TAG = {
  SI: "tag-si", SE: "tag-se", OP: "tag-si",
  SV: "tag-se", MA: "tag-se", TA: "tag-si",
  ADM: "tag-si", RRHH: "tag-si",
};

let kb = {};           // knowledge base cargada del JSON
let activeSector = "SI";
let isLoading = false;
let conversationHistory = []; // historial para Claude API

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────
async function init() {
  await loadKB();
  setupTabs();
  setupInput();
  renderChips("SI");
}

async function loadKB() {
  try {
    const res = await fetch("data/knowledge-base.json");
    const data = await res.json();
    kb = data.procedimientos || {};
    console.log(`KB cargada: ${Object.keys(kb).length} procedimientos`);
  } catch (e) {
    console.error("Error cargando knowledge base:", e);
  }
}

// ──────────────────────────────────────────────
// TABS Y CHIPS
// ──────────────────────────────────────────────
function setupTabs() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeSector = tab.dataset.sector;
      renderChips(activeSector);
    });
  });
}

function renderChips(sector) {
  const wrap = document.getElementById("chips-wrap");
  wrap.innerHTML = "";
  const chips = SECTOR_CHIPS[sector] || [];
  chips.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.textContent = c.label;
    btn.onclick = () => handleSend(c.q);
    wrap.appendChild(btn);
  });
}

// ──────────────────────────────────────────────
// INPUT
// ──────────────────────────────────────────────
function setupInput() {
  const input = document.getElementById("user-input");
  const btn = document.getElementById("send-btn");
  btn.onclick = () => handleSend(input.value.trim());
  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) handleSend(input.value.trim());
  });
}

async function handleSend(text) {
  if (!text || isLoading) return;
  document.getElementById("user-input").value = "";
  addMessage(text, "user");

  isLoading = true;
  document.getElementById("send-btn").disabled = true;

  const typingId = showTyping();

  // 1. Buscar en la KB local
  const match = searchKB(text);

  if (match) {
    await sleep(600);
    removeTyping(typingId);
    addBotMessage(match);
  } else {
    // 2. Fallback a Claude API
    removeTyping(typingId);
    const thinkingId = showThinking();
    try {
      const reply = await askClaude(text);
      removeThinking(thinkingId);
      addBotMessage({ tipo: "claude", respuesta: reply });
    } catch (e) {
      removeThinking(thinkingId);
      addBotMessage({
        tipo: "error",
        respuesta: "No pude conectarme a Claude en este momento. Revisá tu conexión o la configuración de la API key en el archivo js/config.js."
      });
    }
  }

  isLoading = false;
  document.getElementById("send-btn").disabled = false;
}

// ──────────────────────────────────────────────
// BÚSQUEDA EN KB
// ──────────────────────────────────────────────
function searchKB(query) {
  const q = normalizar(query);
  let bestMatch = null;
  let bestScore = 0;

  for (const [, proc] of Object.entries(kb)) {
    let score = 0;

    // Match en título
    if (normalizar(proc.titulo).includes(q)) score += 10;

    // Match en keywords
    for (const kw of (proc.keywords || [])) {
      if (q.includes(normalizar(kw))) score += 5;
      if (normalizar(kw).includes(q)) score += 3;
    }

    // Match parcial en título (palabras sueltas)
    const palabras = q.split(" ").filter(p => p.length > 3);
    for (const p of palabras) {
      if (normalizar(proc.titulo).includes(p)) score += 2;
      for (const kw of (proc.keywords || [])) {
        if (normalizar(kw).includes(p)) score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = proc;
    }
  }

  return bestScore >= 3 ? bestMatch : null;
}

function normalizar(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// ──────────────────────────────────────────────
// CLAUDE API FALLBACK
// ──────────────────────────────────────────────
async function askClaude(userMessage) {
  // Construir contexto del SGI como system prompt
  const systemPrompt = buildSystemPrompt();

  // Agregar al historial
  conversationHistory.push({ role: "user", content: userMessage });

  const body = {
    model: CLAUDE_MODEL,
    max_tokens: 1000,
    system: systemPrompt,
    messages: conversationHistory,
  };

  const res = await fetch(CLAUDE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();

  const reply = data.content?.[0]?.text || "Sin respuesta.";
  conversationHistory.push({ role: "assistant", content: reply });

  // Limitar historial a últimas 10 conversaciones
  if (conversationHistory.length > 20) conversationHistory = conversationHistory.slice(-20);

  return reply;
}

function buildSystemPrompt() {
  const procs = Object.values(kb).map(p =>
    `- ${p.codigo} Rev.${p.revision} "${p.titulo}": ${p.respuesta.substring(0, 200)}...`
  ).join("\n");

  return `Sos la IA del Sistema de Gestión Integrado de Transporte Griffouliere, empresa de transporte en la industria petrolera argentina. Trabajás con normas ISO 9001, ISO 14001, ISO 45001 e ISO 39001.

Tu rol es responder consultas sobre procedimientos del SGI de manera clara, natural y directa, como lo haría un experto en gestión de calidad y seguridad que conoce bien la operación.

Procedimientos disponibles en la base documental:
${procs}

Si la consulta refiere a un procedimiento que tenés en la base, respondé basándote en él. Si no tenés información suficiente, respondé con lo que sabés del tema en el contexto de una empresa de transporte petrolero y avisá que el procedimiento específico no está cargado aún.

Respondé siempre en español rioplatense, de forma natural y sin listas numeradas excesivas. Sé preciso y técnico pero explicá las cosas como si le hablaras a alguien que trabaja en la operación.`;
}

// ──────────────────────────────────────────────
// RENDER MENSAJES
// ──────────────────────────────────────────────
function addMessage(text, who) {
  const msgs = document.getElementById("messages");
  const div = document.createElement("div");
  div.className = `message ${who}`;

  const av = document.createElement("div");
  av.className = `avatar ${who}`;
  av.textContent = who === "bot" ? "G" : "F";

  const bub = document.createElement("div");
  bub.className = "bubble";
  bub.textContent = text;

  div.appendChild(av);
  div.appendChild(bub);
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function addBotMessage(proc) {
  const msgs = document.getElementById("messages");
  const div = document.createElement("div");
  div.className = "message bot";

  const av = document.createElement("div");
  av.className = "avatar bot";
  av.textContent = "G";

  const bub = document.createElement("div");
  bub.className = "bubble";

  if (proc.tipo === "claude") {
    // Respuesta libre de Claude
    const tagEl = document.createElement("span");
    tagEl.className = "tag tag-ok";
    tagEl.textContent = "Consulta libre · Claude";
    bub.appendChild(tagEl);
    const p = document.createElement("p");
    p.innerHTML = proc.respuesta.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");
    bub.appendChild(p);

  } else if (proc.tipo === "error") {
    const p = document.createElement("p");
    p.style.color = "var(--danger-text)";
    p.textContent = proc.respuesta;
    bub.appendChild(p);

  } else {
    // Procedimiento de la KB
    const sector = proc.sector || "SI";
    const tagClass = SECTOR_TAG[sector] || "tag-si";

    const tagEl = document.createElement("span");
    tagEl.className = `tag ${tagClass}`;
    tagEl.textContent = `${proc.codigo} · Rev.${proc.revision} · ${proc.fecha}`;
    bub.appendChild(tagEl);

    // Respuesta en párrafos
    proc.respuesta.split("\n\n").forEach(para => {
      if (!para.trim()) return;
      const p = document.createElement("p");
      p.textContent = para.trim();
      bub.appendChild(p);
    });

    // Alerta si existe
    if (proc.alerta) {
      const alertDiv = document.createElement("div");
      alertDiv.className = "alerta";
      alertDiv.textContent = proc.alerta;
      bub.appendChild(alertDiv);
    }

    // Footer con ref + link
    const footer = document.createElement("div");
    footer.className = "msg-footer";

    const ref = document.createElement("span");
    ref.className = "ref-text";
    ref.textContent = `📄 ${(proc.normas || []).join(" · ")}`;
    footer.appendChild(ref);

    if (proc.url) {
      const link = document.createElement("a");
      link.className = "btn-doc";
      link.href = proc.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Ver procedimiento completo`;
      footer.appendChild(link);
    }

    bub.appendChild(footer);
  }

  div.appendChild(av);
  div.appendChild(bub);
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

// ──────────────────────────────────────────────
// TYPING / THINKING INDICATORS
// ──────────────────────────────────────────────
function showTyping() {
  const id = "typing-" + Date.now();
  const msgs = document.getElementById("messages");
  const div = document.createElement("div");
  div.className = "message bot";
  div.id = id;

  const av = document.createElement("div");
  av.className = "avatar bot";
  av.textContent = "G";

  const bub = document.createElement("div");
  bub.className = "bubble";
  bub.innerHTML = '<div class="typing-bubble"><span></span><span></span><span></span></div>';

  div.appendChild(av);
  div.appendChild(bub);
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return id;
}

function removeTyping(id) {
  document.getElementById(id)?.remove();
}

function showThinking() {
  const id = "thinking-" + Date.now();
  const msgs = document.getElementById("messages");
  const div = document.createElement("div");
  div.className = "message bot";
  div.id = id;

  const av = document.createElement("div");
  av.className = "avatar bot";
  av.textContent = "G";

  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.gap = "4px";

  const bub = document.createElement("div");
  bub.className = "bubble";
  bub.innerHTML = '<div class="typing-bubble"><span></span><span></span><span></span></div>';

  const label = document.createElement("div");
  label.className = "thinking-label";
  label.textContent = "Consultando a Claude...";

  wrap.appendChild(bub);
  wrap.appendChild(label);
  div.appendChild(av);
  div.appendChild(wrap);
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return id;
}

function removeThinking(id) {
  document.getElementById(id)?.remove();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ──────────────────────────────────────────────
// START
// ──────────────────────────────────────────────
init();

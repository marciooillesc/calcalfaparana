// ========= Helpers =========
const brl = (n) => (Number(n || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const num = (v) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
const fmt = (n, d = 2) => (Number(n || 0)).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

function areaM2(wCm, hCm) {
  const w = num(wCm) / 100;
  const h = num(hCm) / 100;
  if (w <= 0 || h <= 0) return 0;
  return w * h;
}

function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}

// ========= State =========
const state = {
  items: [],
  totals: { area: 0, production: 0, extras: 0, install: 0, base: 0, mult: 3, final: 0 }
};

// ========= Elements =========
const itemsWrap = document.getElementById("items");

const installationCostEl = document.getElementById("installationCost");
const extrasEl = document.getElementById("extras");
const multiplierEl = document.getElementById("multiplier");

const kpiArea = document.getElementById("kpiArea");
const kpiProduction = document.getElementById("kpiProduction");
const kpiExtras = document.getElementById("kpiExtras");
const kpiInstall = document.getElementById("kpiInstall");
const kpiBase = document.getElementById("kpiBase");
const kpiFinal = document.getElementById("kpiFinal");
const kpiFinalNote = document.getElementById("kpiFinalNote");
const breakdownEl = document.getElementById("breakdown");

// Quote elements
const yourCompanyEl = document.getElementById("yourCompany");
const yourPhoneEl = document.getElementById("yourPhone");
const clientNameEl = document.getElementById("clientName");
const quoteDateEl = document.getElementById("quoteDate");
const validityDaysEl = document.getElementById("validityDays");
const leadTimeEl = document.getElementById("leadTime");
const notesEl = document.getElementById("notes");

const qCompany = document.getElementById("qCompany");
const qPhone = document.getElementById("qPhone");
const qDate = document.getElementById("qDate");
const qClient = document.getElementById("qClient");
const qTotal = document.getElementById("qTotal");
const qLines = document.getElementById("qLines");
const qLead = document.getElementById("qLead");
const qValidity = document.getElementById("qValidity");
const qNotes = document.getElementById("qNotes");

const qProd = document.getElementById("qProd");
const qExt = document.getElementById("qExt");
const qInst = document.getElementById("qInst");
const qMult = document.getElementById("qMult");

// Tabs
const tabCalc = document.getElementById("tabCalc");
const tabQuote = document.getElementById("tabQuote");
const panelCalc = document.getElementById("panelCalc");
const panelQuote = document.getElementById("panelQuote");

// ========= UI: Tabs =========
function setTab(which) {
  const isCalc = which === "calc";
  tabCalc.classList.toggle("active", isCalc);
  tabQuote.classList.toggle("active", !isCalc);
  tabCalc.setAttribute("aria-selected", String(isCalc));
  tabQuote.setAttribute("aria-selected", String(!isCalc));
  panelCalc.classList.toggle("active", isCalc);
  panelQuote.classList.toggle("active", !isCalc);
}

tabCalc.addEventListener("click", () => setTab("calc"));
tabQuote.addEventListener("click", () => setTab("quote"));

// ========= Items =========
function newItem(data = {}) {
  return {
    id: crypto.randomUUID(),
    desc: data.desc ?? "",
    w: data.w ?? "",
    h: data.h ?? "",
    price: data.price ?? "",
    // computed
    area: 0,
    cost: 0,
  };
}

function addItem(data = {}) {
  state.items.push(newItem(data));
  renderItems();
  calculate();
}

function removeItem(id) {
  state.items = state.items.filter(i => i.id !== id);
  renderItems();
  calculate();
}

function updateItem(id, patch) {
  const it = state.items.find(i => i.id === id);
  if (!it) return;
  Object.assign(it, patch);
  calculate();
  renderItems(); // to refresh pills
}

function computeItem(it) {
  const a = areaM2(it.w, it.h);
  const p = num(it.price);
  const c = a * p;
  return { area: a, cost: c };
}

function renderItems() {
  itemsWrap.innerHTML = "";

  if (state.items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.innerHTML = "Sem itens ainda. Clique em <b>Adicionar</b>.";
    itemsWrap.appendChild(empty);
    return;
  }

  state.items.forEach((it, idx) => {
    const computed = computeItem(it);
    it.area = computed.area;
    it.cost = computed.cost;

    const el = document.createElement("div");
    el.className = "item";

    el.innerHTML = `
      <div class="item-top">
        <div class="item-title">Item ${idx + 1}</div>
        <button class="item-remove" type="button" title="Remover">🗑️</button>
      </div>

      <div class="item-grid">
        <div class="field">
          <label>Descrição</label>
          <input type="text" value="${escapeHtml(it.desc)}" placeholder="Ex: Blackout esquerda / Lona frente" />
        </div>
        <div class="field">
          <label>Largura (cm)</label>
          <input type="number" step="0.1" min="0" value="${it.w}" placeholder="0" />
        </div>
        <div class="field">
          <label>Altura (cm)</label>
          <input type="number" step="0.1" min="0" value="${it.h}" placeholder="0" />
        </div>
        <div class="field">
          <label>R$ / m²</label>
          <input type="number" step="0.01" min="0" value="${it.price}" placeholder="0" />
        </div>
      </div>

      <div class="item-bottom">
        <div class="pill">Área: ${fmt(it.area, 2)} m²</div>
        <div class="pill good">Custo: ${brl(it.cost)}</div>
      </div>
    `;

    const btnRemove = el.querySelector(".item-remove");
    btnRemove.addEventListener("click", () => removeItem(it.id));

    const [descEl, wEl, hEl, priceEl] = el.querySelectorAll("input");
    descEl.addEventListener("input", (e) => updateItem(it.id, { desc: e.target.value }));
    wEl.addEventListener("input", (e) => updateItem(it.id, { w: e.target.value }));
    hEl.addEventListener("input", (e) => updateItem(it.id, { h: e.target.value }));
    priceEl.addEventListener("input", (e) => updateItem(it.id, { price: e.target.value }));

    itemsWrap.appendChild(el);
  });
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ========= Calculation =========
function calculate() {
  const install = num(installationCostEl.value);
  const extras = num(extrasEl.value);
  const mult = Math.max(1, num(multiplierEl.value) || 1);

  let totalArea = 0;
  let production = 0;

  state.items.forEach((it) => {
    const { area, cost } = computeItem(it);
    it.area = area;
    it.cost = cost;
    totalArea += area;
    production += cost;
  });

  const base = production + extras + install;
  const final = base * mult;

  state.totals = { area: totalArea, production, extras, install, base, mult, final };

  // KPIs
  kpiArea.textContent = `${fmt(totalArea, 2)} m²`;
  kpiProduction.textContent = brl(production);
  kpiExtras.textContent = brl(extras);
  kpiInstall.textContent = brl(install);
  kpiBase.textContent = brl(base);
  kpiFinal.textContent = brl(final);
  kpiFinalNote.textContent = `(${brl(base)} × ${fmt(mult, 2)})`;

  breakdownEl.textContent = breakdownText();
}

function breakdownText() {
  const t = state.totals;
  const lines = [];
  lines.push("DETALHAMENTO");
  lines.push("—".repeat(42));
  lines.push(`Área total: ${fmt(t.area, 2)} m²`);
  lines.push("");

  if (state.items.length === 0) {
    lines.push("Nenhum item cadastrado.");
  } else {
    lines.push("Itens:");
    state.items.forEach((it, i) => {
      const name = it.desc?.trim() ? it.desc.trim() : `Item ${i + 1}`;
      lines.push(
        `- ${name}: ${fmt(num(it.w), 1)}cm x ${fmt(num(it.h), 1)}cm = ${fmt(it.area, 2)}m² | ` +
        `${fmt(num(it.price), 2)} R$/m² => ${brl(it.cost)}`
      );
    });
  }

  lines.push("");
  lines.push(`Produção (itens): ${brl(t.production)}`);
  lines.push(`Extras: ${brl(t.extras)}`);
  lines.push(`Instalação: ${brl(t.install)}`);
  lines.push("—".repeat(42));
  lines.push(`Total base: ${brl(t.base)}`);
  lines.push(`Multiplicador: x${fmt(t.mult, 2)}`);
  lines.push(`Preço final: ${brl(t.final)}`);
  return lines.join("\n");
}

// ========= Copy / Quote =========
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copiado ✅");
  } catch {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    toast("Copiado ✅");
  }
}

let toastTimer = null;
function toast(msg) {
  clearTimeout(toastTimer);
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.style.position = "fixed";
    el.style.bottom = "18px";
    el.style.left = "50%";
    el.style.transform = "translateX(-50%)";
    el.style.padding = "10px 12px";
    el.style.borderRadius = "14px";
    el.style.border = "1px solid rgba(255,255,255,.15)";
    el.style.background = "rgba(0,0,0,.55)";
    el.style.color = "#EAF0FF";
    el.style.fontWeight = "900";
    el.style.boxShadow = "0 14px 40px rgba(0,0,0,.35)";
    el.style.zIndex = 9999;
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = "1";
  toastTimer = setTimeout(() => { el.style.opacity = "0"; }, 1300);
}

function clientLinesSummary() {
  // Agrupa por "preço/m²" e totaliza área, só pra ficar bonito pro cliente
  // Mas mantém descrição se o usuário preencher.
  // Saída: array {label, value}
  const lines = [];
  state.items.forEach((it, i) => {
    const label = (it.desc?.trim() ? it.desc.trim() : `Item ${i + 1}`);
    lines.push({ label, value: `${fmt(it.area, 2)} m²` });
  });

  if (num(extrasEl.value) > 0) lines.push({ label: "Extras", value: brl(num(extrasEl.value)) });
  lines.push({ label: "Instalação", value: "Inclusa" });

  return lines;
}

function buildQuoteCard() {
  calculate(); // garante valores atualizados

  const t = state.totals;
  const company = yourCompanyEl.value.trim() || "—";
  const phone = yourPhoneEl.value.trim() || "—";
  const client = clientNameEl.value.trim() || "—";
  const dateVal = quoteDateEl.value || todayISO();
  quoteDateEl.value = dateVal;

  const validityDays = Math.max(1, parseInt(validityDaysEl.value || "7", 10));
  const lead = leadTimeEl.value.trim() || "—";
  const notes = notesEl.value.trim() || "Inclui material, produção, deslocamento, instalação e garantia do serviço.";

  qCompany.textContent = company;
  qPhone.textContent = phone;
  qDate.textContent = new Date(dateVal + "T00:00:00").toLocaleDateString("pt-BR");
  qClient.textContent = client;

  qTotal.textContent = brl(t.final);

  // lines
  qLines.innerHTML = "";
  const lines = clientLinesSummary();
  lines.forEach((ln) => {
    const div = document.createElement("div");
    div.className = "line";
    div.innerHTML = `<span>${escapeHtml(ln.label)}</span><span>${escapeHtml(ln.value)}</span>`;
    qLines.appendChild(div);
  });

  qLead.textContent = lead;
  qValidity.textContent = `${validityDays} dias`;

  qNotes.textContent = notes;

  // internal mini
  qProd.textContent = brl(t.production);
  qExt.textContent = brl(t.extras);
  qInst.textContent = brl(t.install);
  qMult.textContent = `x${fmt(t.mult, 2)}`;
}

function buildQuoteWhatsappText() {
  const t = state.totals;
  const company = yourCompanyEl.value.trim() || "—";
  const phone = yourPhoneEl.value.trim() || "—";
  const client = clientNameEl.value.trim() || "Cliente";
  const dateVal = quoteDateEl.value || todayISO();
  const validityDays = Math.max(1, parseInt(validityDaysEl.value || "7", 10));
  const lead = leadTimeEl.value.trim() || "A combinar";
  const notes = notesEl.value.trim() || "Inclui material, produção, deslocamento, instalação e garantia do serviço.";

  const lines = state.items.map((it, i) => {
    const name = it.desc?.trim() ? it.desc.trim() : `Item ${i + 1}`;
    return `• ${name}: ${fmt(it.area, 2)} m²`;
  });

  if (num(extrasEl.value) > 0) lines.push(`• Extras: ${brl(num(extrasEl.value))}`);
  lines.push(`• Instalação: inclusa`);

  return [
    `*ORÇAMENTO — ${company}*`,
    `Cliente: *${client}*`,
    `Data: ${new Date(dateVal + "T00:00:00").toLocaleDateString("pt-BR")}`,
    ``,
    `*Serviços:*`,
    ...lines,
    ``,
    `*Valor total:* *${brl(t.final)}*`,
    `Prazo: ${lead}`,
    `Validade: ${validityDays} dias`,
    ``,
    `Obs.: ${notes}`,
    ``,
    `Contato: ${phone}`
  ].join("\n");
}

// ========= Buttons =========
document.getElementById("btnAddItem").addEventListener("click", () => addItem());
document.getElementById("btnCalculate").addEventListener("click", () => calculate());

document.getElementById("btnReset").addEventListener("click", () => {
  state.items = [];
  installationCostEl.value = "150";
  extrasEl.value = "0";
  multiplierEl.value = "3";
  renderItems();
  addItem({ desc: "Item 1" });
  calculate();
  toast("Limpo ✅");
});

document.getElementById("btnDemo").addEventListener("click", () => {
  state.items = [];
  renderItems();

  // Exemplo (seus casos)
  addItem({ desc: "Lona frente (440x90) - R$40/m²", w: 440, h: 90, price: 40 });
  addItem({ desc: "Lona lateral (110x90) - R$40/m²", w: 110, h: 90, price: 40 });
  addItem({ desc: "Perf. vidro esquerdo (97x193) - R$60/m²", w: 97, h: 193, price: 60 });
  addItem({ desc: "Perf. vidro direito (98x15) - R$60/m²", w: 98, h: 15, price: 60 });

  extrasEl.value = "240"; // metalon exemplo
  installationCostEl.value = "150";
  multiplierEl.value = "3";
  calculate();
  toast("Exemplo carregado ✅");
});

installationCostEl.addEventListener("input", calculate);
extrasEl.addEventListener("input", calculate);
multiplierEl.addEventListener("input", calculate);

document.getElementById("btnCopyInternal").addEventListener("click", () => {
  calculate();
  copyText(breakdownEl.textContent);
});

document.getElementById("btnBuildQuote").addEventListener("click", () => {
  buildQuoteCard();
  setTab("quote");
  toast("Orçamento gerado ✅");
});

document.getElementById("btnCopyQuote").addEventListener("click", () => {
  buildQuoteCard();
  copyText(buildQuoteWhatsappText());
});

document.getElementById("btnPrint").addEventListener("click", () => {
  buildQuoteCard();
  window.print();
});

// init
quoteDateEl.value = todayISO();
addItem({ desc: "Item 1" });
calculate();
buildQuoteCard();

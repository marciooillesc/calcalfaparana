const itemsBody = document.getElementById("itemsBody");

const installationCostEl = document.getElementById("installationCost");
const multiplierEl = document.getElementById("multiplier");
const extrasEl = document.getElementById("extras");

const kpiArea = document.getElementById("kpiArea");
const kpiProduction = document.getElementById("kpiProduction");
const kpiExtras = document.getElementById("kpiExtras");
const kpiInstall = document.getElementById("kpiInstall");
const kpiBase = document.getElementById("kpiBase");
const kpiFinal = document.getElementById("kpiFinal");
const breakdownEl = document.getElementById("breakdown");

document.getElementById("btnAddItem").addEventListener("click", () => addItem());
document.getElementById("btnCalculate").addEventListener("click", () => calculate());
document.getElementById("btnClear").addEventListener("click", () => clearAll());
document.getElementById("btnDemo").addEventListener("click", () => loadDemo());

function formatBRL(value) {
  const n = Number(value || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatNumber(value, digits = 2) {
  const n = Number(value || 0);
  return n.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function parseNum(v) {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function areaM2(widthCm, heightCm) {
  const w = parseNum(widthCm) / 100;
  const h = parseNum(heightCm) / 100;
  if (w <= 0 || h <= 0) return 0;
  return w * h;
}

function addItem(data = {}) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td><input class="small-input" data-field="desc" placeholder="Ex: Lona frente / Blackout esquerda" value="${escapeHtml(data.desc || "")}"></td>
    <td><input class="small-input" data-field="w" type="number" step="0.1" min="0" value="${data.w ?? ""}"></td>
    <td><input class="small-input" data-field="h" type="number" step="0.1" min="0" value="${data.h ?? ""}"></td>
    <td><input class="small-input" data-field="price" type="number" step="0.01" min="0" value="${data.price ?? ""}"></td>
    <td class="cell-area">0,00</td>
    <td class="cell-cost">R$ 0,00</td>
    <td><button class="icon-btn" type="button" title="Remover">🗑️</button></td>
  `;

  tr.querySelector(".icon-btn").addEventListener("click", () => {
    tr.remove();
    calculate();
  });

  // auto calculate on input
  tr.querySelectorAll("input").forEach((inp) => {
    inp.addEventListener("input", () => calculate());
  });

  itemsBody.appendChild(tr);
  calculate();
}

function getItems() {
  const rows = Array.from(itemsBody.querySelectorAll("tr"));
  return rows.map((row) => {
    const desc = row.querySelector('[data-field="desc"]').value.trim();
    const w = row.querySelector('[data-field="w"]').value;
    const h = row.querySelector('[data-field="h"]').value;
    const price = row.querySelector('[data-field="price"]').value;

    const a = areaM2(w, h);
    const p = parseNum(price);
    const cost = a * p;

    return { row, desc, w: parseNum(w), h: parseNum(h), price: p, area: a, cost };
  });
}

function calculate() {
  const install = parseNum(installationCostEl.value);
  const mult = parseNum(multiplierEl.value);
  const extras = parseNum(extrasEl.value);

  const items = getItems();

  let totalArea = 0;
  let production = 0;

  items.forEach((it) => {
    totalArea += it.area;
    production += it.cost;

    const areaCell = it.row.querySelector(".cell-area");
    const costCell = it.row.querySelector(".cell-cost");

    areaCell.textContent = formatNumber(it.area, 2);
    costCell.textContent = formatBRL(it.cost);
  });

  const base = production + extras + install;
  const final = base * (mult > 0 ? mult : 1);

  kpiArea.textContent = `${formatNumber(totalArea, 2)} m²`;
  kpiProduction.textContent = formatBRL(production);
  kpiExtras.textContent = formatBRL(extras);
  kpiInstall.textContent = formatBRL(install);
  kpiBase.textContent = formatBRL(base);
  kpiFinal.textContent = formatBRL(final);

  breakdownEl.textContent = buildBreakdown(items, install, extras, mult, production, totalArea, base, final);
}

function buildBreakdown(items, install, extras, mult, production, totalArea, base, final) {
  const lines = [];

  lines.push("DETALHAMENTO");
  lines.push("—".repeat(42));
  lines.push(`Área total: ${formatNumber(totalArea, 2)} m²`);
  lines.push("");

  if (items.length === 0) {
    lines.push("Nenhum item cadastrado.");
  } else {
    lines.push("Itens:");
    items.forEach((it, idx) => {
      const name = it.desc || `Item ${idx + 1}`;
      lines.push(
        `- ${name}: ${formatNumber(it.w, 1)}cm x ${formatNumber(it.h, 1)}cm = ${formatNumber(it.area, 2)}m² | ` +
        `${formatNumber(it.price, 2)} R$/m² => ${formatBRL(it.cost)}`
      );
    });
  }

  lines.push("");
  lines.push(`Produção (soma itens): ${formatBRL(production)}`);
  lines.push(`Extras: ${formatBRL(extras)}`);
  lines.push(`Instalação: ${formatBRL(install)}`);
  lines.push("—".repeat(42));
  lines.push(`Total base: ${formatBRL(base)}`);
  lines.push(`Multiplicador: x${formatNumber(mult, 2)}`);
  lines.push(`Preço final: ${formatBRL(final)}`);

  return lines.join("\n");
}

function clearAll() {
  itemsBody.innerHTML = "";
  extrasEl.value = "0";
  installationCostEl.value = "150";
  multiplierEl.value = "3";
  calculate();
}

function loadDemo() {
  clearAll();

  // Exemplo baseado nos seus casos:
  // Lona 40/m²: 440x90 e 110x90
  addItem({ desc: "Lona frente (440x90)", w: 440, h: 90, price: 40 });
  addItem({ desc: "Lona lateral (110x90)", w: 110, h: 90, price: 40 });

  // Adesivo perfurado 60/m²: 97x193 e 98x15
  addItem({ desc: "Perf. vidro esquerdo (97x193)", w: 97, h: 193, price: 60 });
  addItem({ desc: "Perf. vidro direito (98x15)", w: 98, h: 15, price: 60 });

  // Extras: metalon (ex: 3 barras x 80 = 240)
  extrasEl.value = "240";

  // Multiplicador conforme seu novo modelo
  multiplierEl.value = "3";
  installationCostEl.value = "150";
  calculate();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Start with one blank item
addItem({ desc: "Item 1", w: "", h: "", price: "" });

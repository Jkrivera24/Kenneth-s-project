import {
  parseTankTableCsv,
  calculateBunkerQuantity,
  densityInputToKgM3,
  formatNum,
} from "./calculator.js";

const SAMPLE_CSV = `# Sample HFO tank capacity table (replace with your engine-room tables)
tank_name,No.1 HFO Service
list_correction_m3_per_deg,0.15
sounding_m,trim_0.0,trim_1.0,trim_2.0,trim_3.0,trim_4.0
6.0,380.5,378.2,376.0,373.8,371.5
6.5,395.2,392.9,390.7,388.4,386.2
7.0,410.0,407.7,405.5,403.2,401.0
7.5,424.8,422.5,420.3,418.0,415.8
8.0,439.5,437.2,435.0,432.7,430.5
8.5,454.3,452.0,449.8,447.5,445.3
9.0,469.0,466.7,464.5,462.2,460.0
9.5,483.8,481.5,479.3,477.0,474.8
10.0,498.5,496.2,494.0,491.7,489.5`;

const SAMPLE_CSV_2 = `# Second tank example
tank_name,No.2 HFO Settling
list_correction_m3_per_deg,0.12
sounding_m,trim_0.0,trim_1.0,trim_2.0,trim_3.0
5.0,210.0,208.5,207.0,205.5
6.0,260.0,258.5,257.0,255.5
7.0,310.0,308.5,307.0,305.5
8.0,360.0,358.5,357.0,355.5
9.0,410.0,408.5,407.0,405.5`;

const TEMPLATE_CSV = `# Bunker tank capacity table template
# Copy values from your engine-room sounding table
tank_name,Your Tank Name
list_correction_m3_per_deg,0.0
sounding_m,trim_0.0,trim_1.0,trim_2.0
6.0,100.0,98.0,96.0
7.0,120.0,118.0,116.0
8.0,140.0,138.0,136.0`;

/** @type {Map<string, { csv: string, table: object }>} */
const tables = new Map();
let activeTableId = "";

let lastResults = [];

const els = {
  tankTableCsv: document.getElementById("tankTableCsv"),
  tableSelect: document.getElementById("tableSelect"),
  tableStatus: document.getElementById("tableStatus"),
  trim: document.getElementById("trim"),
  listDeg: document.getElementById("listDeg"),
  density: document.getElementById("density"),
  densityUnit: document.getElementById("densityUnit"),
  readingsBody: document.getElementById("readingsBody"),
  totalObs: document.getElementById("totalObs"),
  totalStd: document.getElementById("totalStd"),
  totalMT: document.getElementById("totalMT"),
};

function setTableStatus(msg, ok = true) {
  els.tableStatus.textContent = msg;
  els.tableStatus.className = ok ? "status ok" : "status err";
}

function tableIdFromName(name) {
  return name.replace(/\s+/g, "_").toLowerCase();
}

function refreshTableSelect() {
  els.tableSelect.innerHTML = "";
  for (const [id, entry] of tables) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = entry.table.tankName;
    els.tableSelect.appendChild(opt);
  }
  if (activeTableId && tables.has(activeTableId)) {
    els.tableSelect.value = activeTableId;
  }
}

function registerTable(csv, selectAfter = true) {
  const table = parseTankTableCsv(csv);
  const id = tableIdFromName(table.tankName);
  tables.set(id, { csv, table });
  if (selectAfter) {
    activeTableId = id;
    els.tankTableCsv.value = csv;
  }
  refreshTableSelect();
  setTableStatus(
    `Loaded: ${table.tankName} (${table.soundings.length} soundings × ${table.trims.length} trims)`
  );
  return id;
}

function syncTextareaFromSelect() {
  activeTableId = els.tableSelect.value;
  const entry = tables.get(activeTableId);
  if (entry) {
    els.tankTableCsv.value = entry.csv;
    setTableStatus(`Editing: ${entry.table.tankName}`);
  }
}

function saveTextareaToActiveTable() {
  if (!activeTableId) return null;
  try {
    const table = parseTankTableCsv(els.tankTableCsv.value);
    tables.set(activeTableId, { csv: els.tankTableCsv.value, table });
    refreshTableSelect();
    setTableStatus(`Updated: ${table.tankName}`);
    return table;
  } catch (e) {
    setTableStatus(e.message, false);
    return null;
  }
}

function tableOptionsHtml(selectedId) {
  return [...tables.entries()]
    .map(
      ([id, e]) =>
        `<option value="${id}"${id === selectedId ? " selected" : ""}>${e.table.tankName}</option>`
    )
    .join("");
}

function addTankRow(tableId = activeTableId, name = "", sounding = "8.0", temp = "45") {
  const entry = tables.get(tableId);
  const defaultName = entry?.table.tankName ?? "Tank";
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><select class="table-pick">${tableOptionsHtml(tableId)}</select></td>
    <td><input type="text" class="tank-name" value="${name || defaultName}" placeholder="Tank name" /></td>
    <td><input type="number" class="sounding" step="0.01" value="${sounding}" /></td>
    <td><input type="number" class="temp" step="0.1" value="${temp}" /></td>
    <td class="out obs">—</td>
    <td class="out vcf">—</td>
    <td class="out std">—</td>
    <td class="out mt">—</td>
    <td><button type="button" class="remove secondary small">✕</button></td>
  `;
  tr.querySelector(".remove").addEventListener("click", () => {
    tr.remove();
    runCalculate();
  });
  tr.querySelector(".table-pick").addEventListener("change", (e) => {
    const id = e.target.value;
    const t = tables.get(id)?.table.tankName;
    if (t && !tr.querySelector(".tank-name").value.trim()) {
      tr.querySelector(".tank-name").value = t;
    }
    runCalculate();
  });
  els.readingsBody.appendChild(tr);
}

function runCalculate() {
  saveTextareaToActiveTable();

  const trim = Number(els.trim.value);
  const listDeg = Number(els.listDeg.value);
  const densityKgM3 = densityInputToKgM3(
    els.density.value,
    els.densityUnit.value
  );

  let sumObs = 0;
  let sumStd = 0;
  let sumMT = 0;
  lastResults = [];

  for (const tr of els.readingsBody.querySelectorAll("tr")) {
    const tableId = tr.querySelector(".table-pick").value;
    const entry = tables.get(tableId);
    if (!entry) continue;

    const tankName = tr.querySelector(".tank-name").value.trim() || entry.table.tankName;
    const sounding = Number(tr.querySelector(".sounding").value);
    const tempC = Number(tr.querySelector(".temp").value);

    const result = calculateBunkerQuantity({
      table: entry.table,
      sounding,
      trim,
      listDeg,
      tempC,
      densityKgM3,
    });

    tr.querySelector(".obs").textContent = formatNum(result.observedVolumeM3);
    tr.querySelector(".vcf").textContent = formatNum(result.vcf, 4);
    tr.querySelector(".std").textContent = formatNum(result.standardVolumeM3);
    tr.querySelector(".mt").textContent = formatNum(result.massMT, 2);

    sumObs += result.observedVolumeM3;
    sumStd += result.standardVolumeM3;
    sumMT += result.massMT;

    lastResults.push({
      tankName,
      tableId,
      sounding,
      tempC,
      trim,
      listDeg,
      densityKgM3,
      ...result,
    });
  }

  els.totalObs.textContent = formatNum(sumObs);
  els.totalStd.textContent = formatNum(sumStd);
  els.totalMT.innerHTML = `<strong>${formatNum(sumMT, 2)}</strong>`;
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportResults() {
  if (!lastResults.length) runCalculate();
  if (!lastResults.length) return;

  const header =
    "tank,sounding_m,trim_m,list_deg,temp_c,density_kg_m3,obs_vol_m3,vcf,std_vol_m3,mass_mt";
  const rows = lastResults.map((r) =>
    [
      r.tankName,
      r.sounding,
      r.trim,
      r.listDeg,
      r.tempC,
      r.densityKgM3,
      r.observedVolumeM3.toFixed(3),
      r.vcf.toFixed(4),
      r.standardVolumeM3.toFixed(3),
      r.massMT.toFixed(2),
    ].join(",")
  );
  downloadText("bunker-results.csv", [header, ...rows].join("\n"));
}

document.getElementById("loadSample").addEventListener("click", () => {
  registerTable(SAMPLE_CSV);
  registerTable(SAMPLE_CSV_2, false);
  runCalculate();
});

document.getElementById("downloadTemplate").addEventListener("click", () => {
  downloadText("tank-table-template.csv", TEMPLATE_CSV);
});

document.getElementById("importCsv").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const id = registerTable(await file.text());
  runCalculate();
  e.target.value = "";
  return id;
});

els.tableSelect.addEventListener("change", () => {
  syncTextareaFromSelect();
});

document.getElementById("addTank").addEventListener("click", () => {
  addTankRow(activeTableId, "", "8.0", "45");
});

document.getElementById("calculate").addEventListener("click", runCalculate);
document.getElementById("exportResults").addEventListener("click", exportResults);

["input", "change"].forEach((ev) => {
  els.trim.addEventListener(ev, runCalculate);
  els.listDeg.addEventListener(ev, runCalculate);
  els.density.addEventListener(ev, runCalculate);
  els.densityUnit.addEventListener(ev, runCalculate);
  els.tankTableCsv.addEventListener(ev, () => {
    saveTextareaToActiveTable();
    runCalculate();
  });
});

els.readingsBody.addEventListener("input", runCalculate);

registerTable(SAMPLE_CSV);
registerTable(SAMPLE_CSV_2, false);
addTankRow("no.1_hfo_service", "No.1 HFO Service", "8.5", "45");
addTankRow("no.2_hfo_settling", "No.2 HFO Settling", "7.2", "42");
runCalculate();

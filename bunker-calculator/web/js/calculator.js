/**
 * Bunker fuel quantity calculations (ASTM 54B VCF + sounding table interpolation).
 */

export function linearInterpolate(x, x0, x1, y0, y1) {
  if (x1 === x0) return y0;
  const t = (x - x0) / (x1 - x0);
  return y0 + t * (y1 - y0);
}

export function parseTankTableCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  let tankName = "Tank";
  let listCorrection = 0;
  const headerLine = lines.find((l) => l.startsWith("tank_name,"));
  const listLine = lines.find((l) => l.startsWith("list_correction_m3_per_deg,"));

  if (headerLine) {
    tankName = headerLine.split(",").slice(1).join(",").trim() || tankName;
  }
  if (listLine) {
    listCorrection = Number(listLine.split(",")[1]) || 0;
  }

  const gridLine = lines.find((l) => l.startsWith("sounding_m,"));
  if (!gridLine) {
    throw new Error("Tank table must include a header row starting with sounding_m,");
  }

  const trimHeaders = gridLine.split(",").slice(1);
  const trims = trimHeaders.map((h) => Number(h.replace(/^trim_/, "")));

  const soundings = [];
  const volumes = [];

  for (const line of lines) {
    if (!/^\d/.test(line)) continue;
    const parts = line.split(",");
    const sounding = Number(parts[0]);
    const rowVolumes = parts.slice(1).map(Number);
    if (Number.isNaN(sounding) || rowVolumes.some(Number.isNaN)) continue;
    soundings.push(sounding);
    volumes.push(rowVolumes);
  }

  if (soundings.length < 2) {
    throw new Error("Need at least two sounding rows in the tank table.");
  }

  return { tankName, listCorrection, soundings, trims, volumes };
}

export function lookupVolume(table, sounding, trim, listDeg = 0) {
  const { soundings, trims, volumes, listCorrection } = table;

  let sIdx = 0;
  while (sIdx < soundings.length - 1 && sounding > soundings[sIdx + 1]) sIdx++;

  let tIdx = 0;
  while (tIdx < trims.length - 1 && trim > trims[tIdx + 1]) tIdx++;

  const s0 = soundings[sIdx];
  const s1 = soundings[Math.min(sIdx + 1, soundings.length - 1)];
  const t0 = trims[tIdx];
  const t1 = trims[Math.min(tIdx + 1, trims.length - 1)];

  const v00 = volumes[sIdx][tIdx];
  const v01 = volumes[sIdx][Math.min(tIdx + 1, trims.length - 1)];
  const v10 = volumes[Math.min(sIdx + 1, soundings.length - 1)][tIdx];
  const v11 =
    volumes[Math.min(sIdx + 1, soundings.length - 1)][
      Math.min(tIdx + 1, trims.length - 1)
    ];

  const vS0 = linearInterpolate(sounding, s0, s1, v00, v10);
  const vS1 = linearInterpolate(sounding, s0, s1, v01, v11);
  const observed = linearInterpolate(sounding, s0, s1, vS0, vS1);

  const listAdj = listCorrection * listDeg;
  return {
    observedVolumeM3: observed + listAdj,
    listAdjustmentM3: listAdj,
  };
}

/**
 * ASTM Table 54B VCF to 15°C (fuel oil / gas oil by density @ 15°C).
 * @param {number} densityKgM3 - Density @ 15°C in kg/m³ (e.g. 991)
 * @param {number} tempC - Observed temperature °C
 */
export function vcf54B(densityKgM3, tempC) {
  if (densityKgM3 <= 0) return 1;
  const dt = tempC - 15;
  const alpha = 613.9723 / (densityKgM3 * densityKgM3);
  return Math.exp(-alpha * dt);
}

/**
 * @param {object} params
 * @param {object} params.table - Parsed tank table
 * @param {number} params.sounding - Sounding in metres
 * @param {number} params.trim - Trim in metres (by stern positive)
 * @param {number} params.listDeg - List in degrees (stbd positive)
 * @param {number} params.tempC - Observed temperature °C
 * @param {number} params.densityKgM3 - Density @ 15°C kg/m³
 */
export function calculateBunkerQuantity({
  table,
  sounding,
  trim,
  listDeg,
  tempC,
  densityKgM3,
}) {
  const { observedVolumeM3, listAdjustmentM3 } = lookupVolume(
    table,
    sounding,
    trim,
    listDeg
  );
  const vcf = vcf54B(densityKgM3, tempC);
  const standardVolumeM3 = observedVolumeM3 * vcf;
  const massMT = (standardVolumeM3 * densityKgM3) / 1000;

  return {
    observedVolumeM3,
    listAdjustmentM3,
    vcf,
    standardVolumeM3,
    massMT,
  };
}

export function densityInputToKgM3(value, unit) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  if (unit === "kg_l") return n * 1000;
  return n;
}

export function formatNum(n, decimals = 3) {
  if (Number.isNaN(n)) return "—";
  return n.toFixed(decimals);
}

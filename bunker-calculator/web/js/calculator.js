/**
 * Bunker / sounding quantity calculations (ASTM 54B VCF + table interpolation).
 * Supports grid (sounding × trim) and Hyundai HHI even-keel + trim correction.
 */

export function linearInterpolate(x, x0, x1, y0, y1) {
  if (x1 === x0) return y0;
  const t = (x - x0) / (x1 - x0);
  return y0 + t * (y1 - y0);
}

function interpolateSeries(xs, ys, x) {
  if (!xs.length) return 0;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];

  let idx = 0;
  while (idx < xs.length - 1 && x > xs[idx + 1]) idx++;

  return linearInterpolate(x, xs[idx], xs[idx + 1], ys[idx], ys[idx + 1]);
}

function parseMeta(lines, key, fallback = "") {
  const line = lines.find((l) => l.startsWith(`${key},`));
  if (!line) return fallback;
  return line.split(",").slice(1).join(",").trim();
}

function parseMetaNumber(lines, key, fallback = 0) {
  const v = parseMeta(lines, key, "");
  const n = Number(v);
  return Number.isNaN(n) ? fallback : n;
}

export function parseTankTableCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  const format = parseMeta(lines, "format", "grid");
  const tankId = parseMeta(lines, "tank_id", "");
  const tankName = parseMeta(lines, "tank_name", "Tank");
  const contents = parseMeta(lines, "contents", "");
  const netVolumeM3 = parseMetaNumber(lines, "net_volume_m3", 0);
  const listCorrection = parseMetaNumber(lines, "list_correction_m3_per_deg", 0);

  if (format === "hhi_even_keel") {
    return parseHhiEvenKeelTable(lines, {
      tankId,
      tankName,
      contents,
      netVolumeM3,
      listCorrection,
    });
  }

  return parseGridTable(lines, { tankName, listCorrection });
}

function parseGridTable(lines, meta) {
  const headerLine = lines.find((l) => l.startsWith("sounding_m,"));
  if (!headerLine) {
    throw new Error(
      "Grid table must include sounding_m,trim_… header row, or set format,hhi_even_keel"
    );
  }

  const trimHeaders = headerLine.split(",").slice(1);
  const trims = trimHeaders.map((h) => Number(h.replace(/^trim_/, "")));

  const soundings = [];
  const volumes = [];

  for (const line of lines) {
    if (!/^-?\d/.test(line)) continue;
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

  return {
    format: "grid",
    tankId: "",
    tankName: meta.tankName,
    contents: "",
    netVolumeM3: 0,
    listCorrection: meta.listCorrection,
    soundings,
    trims,
    volumes,
  };
}

function parseHhiEvenKeelTable(lines, meta) {
  const headerLine = lines.find((l) => l.startsWith("sounding_m,"));
  if (!headerLine) {
    throw new Error("HHI table must include sounding_m,ullage_m,volume_m3,trim_corr_m3_per_m");
  }

  const headers = headerLine.split(",").map((h) => h.trim());
  const ullageCol = headers.indexOf("ullage_m");
  const volumeCol = headers.indexOf("volume_m3");
  const trimCol = headers.indexOf("trim_corr_m3_per_m");

  if (volumeCol < 0) {
    throw new Error("HHI table header must include volume_m3 column.");
  }

  const soundings = [];
  const ullages = [];
  const volumesEven = [];
  const trimCorrs = [];

  for (const line of lines) {
    if (!/^-?\d/.test(line)) continue;
    const parts = line.split(",");
    const sounding = Number(parts[0]);
    if (Number.isNaN(sounding)) continue;

    const volume = Number(parts[volumeCol]);
    if (Number.isNaN(volume)) continue;

    soundings.push(sounding);
    volumesEven.push(volume);
    ullages.push(
      ullageCol >= 0 && parts[ullageCol] !== "" ? Number(parts[ullageCol]) : NaN
    );
    trimCorrs.push(
      trimCol >= 0 && parts[trimCol] !== "" ? Number(parts[trimCol]) : 0
    );
  }

  if (soundings.length < 2) {
    throw new Error(
      "HHI table needs at least two data rows (copy from manual sounding/ullage pages)."
    );
  }

  const hasUllage = ullages.every((u) => !Number.isNaN(u));

  return {
    format: "hhi_even_keel",
    tankId: meta.tankId,
    tankName: meta.tankName,
    contents: meta.contents,
    netVolumeM3: meta.netVolumeM3,
    listCorrection: meta.listCorrection,
    soundings,
    ullages: hasUllage ? ullages : null,
    volumesEven,
    trimCorrs,
  };
}

export function lookupVolumeGrid(table, sounding, trim, listDeg = 0) {
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
  const observed = linearInterpolate(trim, t0, t1, vS0, vS1);

  const listAdj = listCorrection * listDeg;
  return {
    observedVolumeM3: observed + listAdj,
    listAdjustmentM3: listAdj,
    trimAdjustmentM3: 0,
    volumeEvenKeelM3: observed,
  };
}

export function lookupVolumeHhi(table, { sounding, ullage, trim, listDeg = 0 }) {
  const { soundings, ullages, volumesEven, trimCorrs, listCorrection } = table;

  let volumeEven;
  let trimCorrPerM;

  if (ullage != null && ullages) {
    volumeEven = interpolateSeries(ullages, volumesEven, ullage);
    trimCorrPerM = interpolateSeries(ullages, trimCorrs, ullage);
  } else if (sounding != null) {
    volumeEven = interpolateSeries(soundings, volumesEven, sounding);
    trimCorrPerM = interpolateSeries(soundings, trimCorrs, sounding);
  } else {
    throw new Error("Enter sounding or ullage.");
  }

  const trimAdj = trimCorrPerM * trim;
  const listAdj = listCorrection * listDeg;
  const observed = volumeEven + trimAdj + listAdj;

  return {
    observedVolumeM3: observed,
    listAdjustmentM3: listAdj,
    trimAdjustmentM3: trimAdj,
    volumeEvenKeelM3: volumeEven,
  };
}

export function lookupVolume(table, sounding, trim, listDeg = 0) {
  if (table.format === "hhi_even_keel") {
    return lookupVolumeHhi(table, { sounding, ullage: null, trim, listDeg });
  }
  return lookupVolumeGrid(table, sounding, trim, listDeg);
}

export function vcf54B(densityKgM3, tempC) {
  if (densityKgM3 <= 0) return 1;
  const dt = tempC - 15;
  const alpha = 613.9723 / (densityKgM3 * densityKgM3);
  return Math.exp(-alpha * dt);
}

/**
 * @param {object} params
 * @param {object} params.table
 * @param {number} [params.sounding]
 * @param {number} [params.ullage]
 * @param {"sounding"|"ullage"} [params.measurementType]
 * @param {number} params.trim
 * @param {number} params.listDeg
 * @param {number} params.tempC
 * @param {number} params.densityKgM3
 */
export function calculateBunkerQuantity({
  table,
  sounding,
  ullage,
  measurementType = "sounding",
  trim,
  listDeg,
  tempC,
  densityKgM3,
}) {
  let volumeResult;

  if (table.format === "hhi_even_keel") {
    if (measurementType === "ullage" && table.ullages) {
      volumeResult = lookupVolumeHhi(table, {
        sounding: null,
        ullage,
        trim,
        listDeg,
      });
    } else {
      volumeResult = lookupVolumeHhi(table, {
        sounding,
        ullage: null,
        trim,
        listDeg,
      });
    }
  } else {
    if (measurementType === "ullage") {
      throw new Error("Ullage input requires HHI even-keel table with ullage_m column.");
    }
    volumeResult = lookupVolumeGrid(table, sounding, trim, listDeg);
  }

  const vcf = vcf54B(densityKgM3, tempC);
  const standardVolumeM3 = volumeResult.observedVolumeM3 * vcf;
  const massMT = (standardVolumeM3 * densityKgM3) / 1000;

  return {
    ...volumeResult,
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

export function tableSummary(table) {
  if (table.format === "hhi_even_keel") {
    const rows = table.soundings.length;
    const ull = table.ullages ? " + ullage" : "";
    return `${table.tankName} [HHI, ${rows} rows${ull}]`;
  }
  return `${table.tankName} [grid, ${table.soundings.length}×${table.trims.length}]`;
}

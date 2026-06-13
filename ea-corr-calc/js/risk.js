/** Correlation + trend risk engine (matches ea-risk-calculator Excel logic). */

export const SYMBOLS = [
  'EURUSD', 'GBPUSD', 'AUDUSD', 'NZDUSD',
  'USDCHF', 'USDCAD', 'USDJPY', 'XAUUSD', 'BTCUSD',
];

export const DEFAULT_PIP_VALUES = {
  EURUSD: { pipSize: 0.0001, dollarPerPip: 10 },
  GBPUSD: { pipSize: 0.0001, dollarPerPip: 10 },
  AUDUSD: { pipSize: 0.0001, dollarPerPip: 10 },
  NZDUSD: { pipSize: 0.0001, dollarPerPip: 10 },
  USDCHF: { pipSize: 0.0001, dollarPerPip: 10 },
  USDCAD: { pipSize: 0.0001, dollarPerPip: 10 },
  USDJPY: { pipSize: 0.01, dollarPerPip: 9.1 },
  XAUUSD: { pipSize: 0.01, dollarPerPip: 100 },
  BTCUSD: { pipSize: 0.01, dollarPerPip: 1 },
};

export const DEFAULT_TRENDS = {
  AUD: 'STRONG',
  CAD: 'STRONG',
  EUR: 'NEUTRAL',
  GBP: 'WEAK',
  JPY: 'NEUTRAL',
  NZD: 'NEUTRAL',
  USD: 'NEUTRAL',
  XAU: 'NEUTRAL',
  BTC: 'NEUTRAL',
};

export const DEFAULT_SETTINGS = {
  accountSize: 5000,
  maxLossLimitPct: 0.06,
  maxDailyLossPct: 0.03,
  maxGroupRiskPct: 0.01,
  reduceCorrelated: true,
  baseRiskPct: 0.005,
  minTpPips: 50,
  trendFilter: true,
  todayRealizedLoss: 0,
};

export function pipSize(symbol) {
  return DEFAULT_PIP_VALUES[symbol]?.pipSize ?? 0.0001;
}

export function dollarPerPip(symbol, pipTable = DEFAULT_PIP_VALUES) {
  return pipTable[symbol]?.dollarPerPip ?? 10;
}

export function getCorrelationGroup(symbol, direction) {
  const buy = direction === 'Buy';
  if (symbol === 'XAUUSD') return buy ? 'A' : 'B';
  if (['EURUSD', 'GBPUSD', 'AUDUSD', 'NZDUSD'].includes(symbol)) return buy ? 'A' : 'B';
  if (['USDCHF', 'USDCAD'].includes(symbol)) return buy ? 'B' : 'A';
  return 'None';
}

export function priceToPips(symbol, priceDiff) {
  return Math.abs(priceDiff) / pipSize(symbol);
}

export function slPipsFromTp(tpPips, minTp) {
  if (tpPips < minTp) return null;
  if (tpPips < 100) return tpPips / 2;
  if (tpPips < 200) return tpPips / 3;
  if (tpPips < 300) return tpPips / 4;
  if (tpPips < 400) return tpPips / 5;
  return tpPips / 6;
}

export function slPrice(symbol, direction, entry, slPips) {
  const step = pipSize(symbol) * slPips;
  return direction === 'Buy' ? entry - step : entry + step;
}

export function correlationScale(openCount, reduceCorrelated) {
  if (!reduceCorrelated) return 1;
  const scales = [1, 0.5, 0.25, 0.125];
  return scales[Math.min(openCount, 3)];
}

export function maxLot(accountSize) {
  return Math.floor(accountSize / 1000) * 0.01;
}

export function baseCurrency(symbol) {
  if (symbol === 'XAUUSD') return 'XAU';
  if (symbol === 'BTCUSD') return 'BTC';
  if (symbol.startsWith('USD')) return symbol.slice(3);
  return symbol.slice(0, 3);
}

export function passesTrendFilter(symbol, direction, trends, trendFilterEnabled) {
  if (!trendFilterEnabled) return { pass: true, label: 'PASS (filter off)' };

  if (symbol === 'BTCUSD') return { pass: true, label: 'PASS' };

  const base = baseCurrency(symbol);
  const baseTrend = trends[base] || 'NEUTRAL';
  const usdTrend = trends.USD || 'NEUTRAL';

  if (symbol === 'XAUUSD') {
    if (direction === 'Buy') {
      if (usdTrend === 'WEAK' || usdTrend === 'NEUTRAL') return { pass: true, label: 'PASS' };
      return { pass: false, label: 'FAIL: XAU Buy vs USD STRONG' };
    }
    if (usdTrend === 'STRONG' || usdTrend === 'NEUTRAL') return { pass: true, label: 'PASS' };
    return { pass: false, label: 'FAIL: XAU Sell vs USD WEAK' };
  }

  if (symbol.startsWith('USD')) {
    if (direction === 'Buy') {
      if (usdTrend === 'STRONG' || usdTrend === 'NEUTRAL') return { pass: true, label: 'PASS' };
      return { pass: false, label: 'FAIL: USD Buy vs USD not STRONG' };
    }
    if (usdTrend === 'WEAK' || usdTrend === 'NEUTRAL') return { pass: true, label: 'PASS' };
    return { pass: false, label: 'FAIL: USD Sell vs USD not WEAK' };
  }

  if (direction === 'Buy') {
    if (baseTrend === 'STRONG' || baseTrend === 'NEUTRAL') return { pass: true, label: 'PASS' };
    return { pass: false, label: `FAIL: Buy vs ${base} WEAK` };
  }
  if (baseTrend === 'WEAK' || baseTrend === 'NEUTRAL') return { pass: true, label: 'PASS' };
  return { pass: false, label: `FAIL: Sell vs ${base} STRONG` };
}

export function positionRiskPct(symbol, slPips, lot, accountSize, pipTable) {
  if (!symbol || !slPips || !lot || !accountSize) return 0;
  return (slPips * dollarPerPip(symbol, pipTable) * lot / accountSize) * 100;
}

export function enrichPosition(pos, settings, pipTable) {
  const group = getCorrelationGroup(pos.symbol, pos.direction);
  const slPips = pos.sl != null && pos.entry != null
    ? priceToPips(pos.symbol, pos.entry - pos.sl)
    : pos.slPips || 0;
  const riskPct = positionRiskPct(pos.symbol, slPips, pos.lot, settings.accountSize, pipTable);
  return { ...pos, group, slPips, riskPct };
}

export function groupSummary(positions, settings, pipTable) {
  const enriched = positions.filter((p) => p.symbol).map((p) => enrichPosition(p, settings, pipTable));
  const summarize = (group) => {
    const inGroup = enriched.filter((p) => p.group === group);
    const totalRisk = inGroup.reduce((s, p) => s + p.riskPct, 0);
    const list = inGroup.map((p) => `${p.symbol} ${p.direction}`).join(', ');
    const capPct = settings.maxGroupRiskPct * 100;
    return {
      group,
      positions: inGroup,
      list: list || '—',
      totalRisk,
      headroom: capPct - totalRisk,
      capPct,
    };
  };
  return { A: summarize('A'), B: summarize('B') };
}

export function evaluatePendingOrder(input, settings, positions, trends, pipTable) {
  const {
    symbol,
    direction,
    entry,
    tp,
    currentPrice,
  } = input;

  const result = {
    symbol,
    direction,
    entry,
    tp,
    currentPrice,
    gates: [],
  };

  if (!symbol || !direction || entry == null || tp == null) {
    result.verdict = 'INCOMPLETE';
    result.finalLot = null;
    return result;
  }

  const trend = passesTrendFilter(symbol, direction, trends, settings.trendFilter);
  result.gates.push({
    step: 1,
    name: 'Trend filter',
    status: trend.pass ? 'pass' : 'fail',
    detail: trend.label,
  });
  if (!trend.pass) {
    result.verdict = trend.label;
    result.finalLot = null;
    return result;
  }

  const tpPips = priceToPips(symbol, tp - entry);
  result.tpPips = tpPips;

  const tpOk = tpPips >= settings.minTpPips;
  result.gates.push({
    step: 2,
    name: 'Min TP',
    status: tpOk ? 'pass' : 'fail',
    detail: tpOk ? `${tpPips.toFixed(1)} pips (min ${settings.minTpPips})` : `FAIL: TP ${tpPips.toFixed(1)} < ${settings.minTpPips} pips`,
  });
  if (!tpOk) {
    result.verdict = `FAIL: TP < ${settings.minTpPips} pips`;
    result.finalLot = null;
    return result;
  }

  const slPips = slPipsFromTp(tpPips, settings.minTpPips);
  result.slPips = slPips;
  result.slPrice = slPrice(symbol, direction, entry, slPips);

  if (currentPrice != null && !Number.isNaN(currentPrice)) {
    const pullbackPips = priceToPips(symbol, currentPrice - entry);
    result.pullbackPips = pullbackPips;
    result.pullbackLabel = direction === 'Buy'
      ? (currentPrice > entry ? `${pullbackPips.toFixed(1)} pips below current` : `${pullbackPips.toFixed(1)} pips above current`)
      : (currentPrice < entry ? `${pullbackPips.toFixed(1)} pips above current` : `${pullbackPips.toFixed(1)} pips below current`);
  }

  const group = getCorrelationGroup(symbol, direction);
  result.group = group;

  const enriched = positions.filter((p) => p.symbol).map((p) => enrichPosition(p, settings, pipTable));
  const openInGroup = enriched.filter((p) => p.group === group).length;
  result.openInGroup = openInGroup;

  const scale = correlationScale(openInGroup, settings.reduceCorrelated);
  result.correlationScale = scale;

  const dpp = dollarPerPip(symbol, pipTable);
  const baseLot = (settings.baseRiskPct * settings.accountSize) / (slPips * dpp);
  const scaledLot = baseLot * scale;
  const lotCap = maxLot(settings.accountSize);
  const cappedLot = Math.min(scaledLot, lotCap);

  result.baseLot = baseLot;
  result.scaledLot = scaledLot;
  result.cappedLot = cappedLot;

  const candidateRisk = positionRiskPct(symbol, slPips, cappedLot, settings.accountSize, pipTable);
  result.candidateRiskPct = candidateRisk;

  const groups = groupSummary(positions, settings, pipTable);
  const currentGroupRisk = group === 'A' ? groups.A.totalRisk : group === 'B' ? groups.B.totalRisk : 0;
  result.currentGroupRiskPct = currentGroupRisk;
  result.projectedGroupRiskPct = currentGroupRisk + candidateRisk;

  const capPct = settings.maxGroupRiskPct * 100;
  const groupCapOk = group === 'None' || result.projectedGroupRiskPct <= capPct;
  result.gates.push({
    step: 3,
    name: 'Correlation group',
    status: 'info',
    detail: `Group ${group} · ${openInGroup} open · scale ${(scale * 100).toFixed(1)}%`,
  });
  result.gates.push({
    step: 4,
    name: 'Group risk cap',
    status: groupCapOk ? 'pass' : 'fail',
    detail: group === 'None'
      ? 'Outside A/B groups'
      : `${currentGroupRisk.toFixed(2)}% + ${candidateRisk.toFixed(2)}% = ${result.projectedGroupRiskPct.toFixed(2)}% (max ${capPct}%)`,
  });

  const dailyLimit = settings.accountSize * settings.maxDailyLossPct;
  const dailyOk = settings.todayRealizedLoss <= dailyLimit;
  result.gates.push({
    step: 5,
    name: 'Daily loss',
    status: dailyOk ? 'pass' : 'fail',
    detail: dailyOk
      ? `$${settings.todayRealizedLoss.toFixed(0)} / $${dailyLimit.toFixed(0)} limit`
      : `FAIL: daily loss $${settings.todayRealizedLoss.toFixed(0)} exceeds $${dailyLimit.toFixed(0)}`,
  });

  const portfolioLimit = settings.accountSize * settings.maxLossLimitPct;
  const portfolioOk = settings.todayRealizedLoss <= portfolioLimit;
  result.gates.push({
    step: 6,
    name: 'Portfolio buffer',
    status: portfolioOk ? 'pass' : 'fail',
    detail: portfolioOk
      ? `$${settings.todayRealizedLoss.toFixed(0)} / $${portfolioLimit.toFixed(0)} (6%)`
      : `FAIL: exceeds 6% portfolio limit`,
  });

  let headroomLot = null;
  if (group !== 'None' && slPips > 0) {
    const capDollars = settings.maxGroupRiskPct * settings.accountSize;
    const usedDollars = (currentGroupRisk / 100) * settings.accountSize;
    const remaining = capDollars - usedDollars;
    headroomLot = Math.max(0, remaining / (slPips * dpp));
  }
  result.headroomLot = headroomLot;

  let finalLot = null;
  let verdict = 'APPROVE';

  if (!dailyOk) {
    verdict = 'FAIL: daily loss limit';
  } else if (!portfolioOk) {
    verdict = 'FAIL: portfolio limit';
  } else if (!groupCapOk) {
    if (settings.reduceCorrelated && headroomLot >= 0.01) {
      finalLot = Math.floor(Math.min(cappedLot, headroomLot, lotCap) * 100) / 100;
      if (finalLot >= 0.01) {
        verdict = 'REDUCE';
      } else {
        verdict = 'FAIL: exceeds group cap';
        finalLot = null;
      }
    } else {
      verdict = settings.reduceCorrelated ? 'REDUCE OR REJECT' : `FAIL: exceeds ${capPct}% group cap`;
    }
  } else {
    finalLot = Math.floor(cappedLot * 100) / 100;
    if (finalLot < 0.01) {
      verdict = 'FAIL: lot below minimum';
      finalLot = null;
    }
  }

  result.finalLot = finalLot;
  result.verdict = verdict;
  const actualRisk = finalLot
    ? positionRiskPct(symbol, slPips, finalLot, settings.accountSize, pipTable)
    : candidateRisk;
  result.projectedGroupRiskPct = currentGroupRisk + actualRisk;
  result.logLine = `[CORR] ${symbol} ${direction} | Trend=${trend.label} | Group=${group} | open=${openInGroup} | scale=${(scale * 100).toFixed(0)}% | lot=${finalLot ?? '0'} | groupRisk=${currentGroupRisk.toFixed(2)}%+${actualRisk.toFixed(2)}%=${result.projectedGroupRiskPct.toFixed(2)}% | ${verdict}`;

  return result;
}

export const SIM_POSITIONS = [
  { symbol: 'XAUUSD', direction: 'Buy', entry: 2650, sl: 2640, lot: 0.02 },
  { symbol: 'EURUSD', direction: 'Buy', entry: 1.085, sl: 1.08, lot: 0.03 },
  { symbol: 'AUDUSD', direction: 'Buy', entry: 0.708, sl: 0.703, lot: 0.02 },
  { symbol: 'NZDUSD', direction: 'Buy', entry: 0.612, sl: 0.607, lot: 0.02 },
  { symbol: 'USDCHF', direction: 'Buy', entry: 0.885, sl: 0.88, lot: 0.02 },
  { symbol: 'USDCAD', direction: 'Buy', entry: 1.365, sl: 1.36, lot: 0.02 },
];

export const SIM_TESTS = [
  { id: 'T1', symbol: 'GBPUSD', direction: 'Buy', entry: 1.265, tp: 1.275, note: 'GBP WEAK — trend block' },
  { id: 'T2', symbol: 'GBPUSD', direction: 'Sell', entry: 1.265, tp: 1.255, note: 'GBP WEAK supports sell' },
  { id: 'T3', symbol: 'EURUSD', direction: 'Buy', entry: 1.085, tp: 1.095, note: '5th Group A leg — 12.5% scale' },
  { id: 'T4', symbol: 'AUDUSD', direction: 'Buy', entry: 0.7084, tp: 0.7093, note: 'Only 9 pips — min TP fail' },
  { id: 'T5', symbol: 'BTCUSD', direction: 'Buy', entry: 95000, tp: 96000, note: 'Outside groups' },
  { id: 'T6', symbol: 'XAUUSD', direction: 'Buy', entry: 2650, tp: 2680, note: 'Gold Group A' },
  { id: 'T7', symbol: 'USDCHF', direction: 'Sell', entry: 0.885, tp: 0.875, note: 'CHF sell → Group A' },
  { id: 'T8', symbol: 'AUDUSD', direction: 'Buy', entry: 0.708, tp: 0.718, note: '2nd leg — 50% scale (use 1 position)' },
];

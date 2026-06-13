import {
  SYMBOLS,
  evaluatePendingOrder,
  groupSummary,
  enrichPosition,
  SIM_POSITIONS,
  SIM_TESTS,
  maxLot,
} from './risk.js';
import {
  loadState,
  saveState,
  updateSettings,
  setPositions,
  addPosition,
  removePosition,
  savePendingDraft,
  deletePendingDraft,
} from './storage.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let state = loadState();

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function showTab(name) {
  $$('.panel').forEach((p) => p.classList.remove('active'));
  $(`#panel-${name}`).classList.add('active');
  $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  if (name === 'pending') renderPending();
  if (name === 'positions') renderPositions();
  if (name === 'risk') renderRiskMonitor();
  if (name === 'settings') renderSettings();
  if (name === 'study') renderStudy();
}

function verdictClass(v) {
  if (!v) return 'muted';
  if (v === 'APPROVE') return 'pass';
  if (v === 'REDUCE') return 'warn';
  if (v.startsWith('INCOMPLETE')) return 'muted';
  return 'fail';
}

function gateIcon(status) {
  if (status === 'pass') return '✓';
  if (status === 'fail') return '✗';
  return '·';
}

function num(val) {
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : null;
}

function getPendingInput() {
  return {
    symbol: $('#p-symbol').value,
    direction: $('#p-direction').value,
    entry: num($('#p-entry').value),
    tp: num($('#p-tp').value),
    currentPrice: num($('#p-current').value),
  };
}

function renderPendingResult(result) {
  const el = $('#pending-result');
  if (!result || result.verdict === 'INCOMPLETE') {
    el.innerHTML = '<p class="empty">Fill symbol, direction, pullback entry, and TP to check gates.</p>';
    return;
  }

  const vClass = verdictClass(result.verdict);
  el.innerHTML = `
    <div class="verdict-box ${vClass}">
      <span class="verdict-label">${esc(result.verdict)}</span>
      ${result.finalLot != null ? `<span class="verdict-lot">Lot: ${result.finalLot.toFixed(2)}</span>` : ''}
    </div>
    ${result.pullbackLabel ? `<p class="pullback-note">Pullback: ${esc(result.pullbackLabel)}</p>` : ''}
    <div class="stat-grid">
      <div class="stat"><span>TP</span><strong>${result.tpPips?.toFixed(1)} pips</strong></div>
      <div class="stat"><span>SL</span><strong>${result.slPips?.toFixed(1)} pips @ ${result.slPrice?.toFixed(5)}</strong></div>
      <div class="stat"><span>Group</span><strong>${esc(result.group)} (${result.openInGroup} open)</strong></div>
      <div class="stat"><span>Scale</span><strong>${(result.correlationScale * 100).toFixed(1)}%</strong></div>
    </div>
    <ol class="gate-list">
      ${result.gates.map((g) => `
        <li class="gate gate-${g.status}">
          <span class="gate-icon">${gateIcon(g.status)}</span>
          <div>
            <strong>${esc(g.name)}</strong>
            <p>${esc(g.detail)}</p>
          </div>
        </li>`).join('')}
    </ol>
    <div class="log-box">
      <label>Journal line</label>
      <code id="log-line">${esc(result.logLine)}</code>
      <button type="button" class="btn btn-sm" id="btn-copy-log">Copy</button>
    </div>
  `;

  $('#btn-copy-log')?.addEventListener('click', () => {
    navigator.clipboard.writeText(result.logLine).then(() => showToast('Copied to clipboard'));
  });
}

function renderPending() {
  const input = getPendingInput();
  const result = evaluatePendingOrder(input, state.settings, state.positions, state.trends, state.pipValues);
  renderPendingResult(result);

  const drafts = state.pendingDrafts || [];
  const list = $('#pending-drafts');
  if (!drafts.length) {
    list.innerHTML = '<p class="empty">Saved pending checks appear here.</p>';
    return;
  }
  list.innerHTML = drafts.map((d) => `
    <article class="card card-static" data-draft="${d.id}">
      <div class="card-top">
        <h3>${esc(d.symbol)} ${esc(d.direction)} @ ${esc(d.entry)}</h3>
        <span class="badge ${verdictClass(d.verdict)}">${esc(d.verdict)}</span>
      </div>
      <p class="card-meta">${esc(d.savedAt?.slice(0, 16).replace('T', ' '))} · lot ${d.finalLot ?? '—'}</p>
      <button type="button" class="btn btn-sm btn-load" data-load="${d.id}">Load</button>
      <button type="button" class="btn btn-sm btn-danger" data-del="${d.id}">Delete</button>
    </article>
  `).join('');

  list.querySelectorAll('[data-load]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const d = drafts.find((x) => x.id === btn.dataset.load);
      if (!d) return;
      $('#p-symbol').value = d.symbol;
      $('#p-direction').value = d.direction;
      $('#p-entry').value = d.entry;
      $('#p-tp').value = d.tp;
      $('#p-current').value = d.currentPrice ?? '';
      showToast('Loaded draft');
      renderPending();
    });
  });

  list.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', () => {
      deletePendingDraft(state, btn.dataset.del);
      renderPending();
      showToast('Draft removed');
    });
  });
}

function renderPositions() {
  const positions = state.positions.filter((p) => p.symbol);
  const el = $('#position-list');
  if (!positions.length) {
    el.innerHTML = '<p class="empty">No open positions. Add trades from your broker or load sim data in Study tab.</p>';
    return;
  }

  el.innerHTML = positions.map((p) => {
    const e = enrichPosition(p, state.settings, state.pipValues);
    return `
      <article class="card card-static">
        <div class="card-top">
          <h3>${esc(e.symbol)} ${esc(e.direction)} · ${e.lot} lot</h3>
          <span class="badge group-${e.group.toLowerCase()}">Group ${esc(e.group)}</span>
        </div>
        <p class="card-meta">Entry ${e.entry} · SL ${e.sl} · ${e.slPips?.toFixed(0)} pips · ${e.riskPct?.toFixed(2)}% risk</p>
        <button type="button" class="btn btn-sm btn-danger" data-rm="${p.id}">Remove</button>
      </article>`;
  }).join('');

  el.querySelectorAll('[data-rm]').forEach((btn) => {
    btn.addEventListener('click', () => {
      removePosition(state, btn.dataset.rm);
      renderPositions();
      showToast('Position removed');
    });
  });
}

function renderRiskMonitor() {
  const groups = groupSummary(state.positions, state.settings, state.pipValues);
  const el = $('#risk-monitor');
  el.innerHTML = ['A', 'B'].map((g) => {
    const s = groups[g];
    const pct = s.capPct ? (s.totalRisk / s.capPct) * 100 : 0;
    const barClass = pct >= 100 ? 'full' : pct >= 80 ? 'high' : '';
    return `
      <div class="group-card">
        <div class="group-header">
          <h3>Group ${g}</h3>
          <span>${s.totalRisk.toFixed(2)}% / ${s.capPct}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill ${barClass}" style="width:${Math.min(pct, 100)}%"></div></div>
        <p class="card-meta">Headroom: <strong>${s.headroom.toFixed(2)}%</strong></p>
        <p class="group-list">${esc(s.list)}</p>
      </div>`;
  }).join('');
}

function renderSettings() {
  const s = state.settings;
  $('#settings-form').innerHTML = `
    <label>Account size ($)<input type="number" id="s-account" value="${s.accountSize}" step="100"></label>
    <label>Today realized loss ($)<input type="number" id="s-today-loss" value="${s.todayRealizedLoss}" step="1"></label>
    <label>Max group risk (decimal, 0.01 = 1%)<input type="number" id="s-group" value="${s.maxGroupRiskPct}" step="0.001"></label>
    <label>Base risk per trade (0.005 = 0.5%)<input type="number" id="s-base" value="${s.baseRiskPct}" step="0.001"></label>
    <label>Min TP (pips)<input type="number" id="s-mintp" value="${s.minTpPips}" step="1"></label>
    <label class="check"><input type="checkbox" id="s-reduce" ${s.reduceCorrelated ? 'checked' : ''}> Reduce lots for correlated trades</label>
    <label class="check"><input type="checkbox" id="s-trend" ${s.trendFilter ? 'checked' : ''}> Trend filter (hard gate)</label>
    <p class="card-meta">Max lot cap: <strong>${maxLot(s.accountSize).toFixed(2)}</strong> (0.01 per $1k)</p>
    <button type="button" class="btn btn-green" id="btn-save-settings">Save settings</button>

    <h3 class="section-title">Trend table</h3>
    <div class="trend-grid" id="trend-grid"></div>
    <button type="button" class="btn btn-blue" id="btn-save-trends">Save trends</button>
  `;

  const trendEl = $('#trend-grid');
  trendEl.innerHTML = Object.entries(state.trends).map(([cur, val]) => `
    <label>${cur}
      <select data-cur="${cur}">
        ${['STRONG', 'NEUTRAL', 'WEAK'].map((t) => `<option value="${t}" ${t === val ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
    </label>
  `).join('');

  $('#btn-save-settings').addEventListener('click', () => {
    updateSettings(state, {
      accountSize: num($('#s-account').value) ?? 5000,
      todayRealizedLoss: num($('#s-today-loss').value) ?? 0,
      maxGroupRiskPct: num($('#s-group').value) ?? 0.01,
      baseRiskPct: num($('#s-base').value) ?? 0.005,
      minTpPips: num($('#s-mintp').value) ?? 50,
      reduceCorrelated: $('#s-reduce').checked,
      trendFilter: $('#s-trend').checked,
    });
    showToast('Settings saved');
    renderSettings();
  });

  $('#btn-save-trends').addEventListener('click', () => {
    const trends = {};
    trendEl.querySelectorAll('select').forEach((sel) => {
      trends[sel.dataset.cur] = sel.value;
    });
    state.trends = trends;
    saveState(state);
    showToast('Trends saved');
  });
}

function renderStudy() {
  const el = $('#study-tests');
  el.innerHTML = SIM_TESTS.map((t) => `
    <article class="card" data-test="${t.id}">
      <div class="card-top">
        <h3>${t.id}: ${esc(t.symbol)} ${esc(t.direction)}</h3>
      </div>
      <p class="card-meta">${esc(t.note)}</p>
    </article>
  `).join('');

  el.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => {
      const t = SIM_TESTS.find((x) => x.id === card.dataset.test);
      if (!t) return;
      if (t.id === 'T8') {
        setPositions(state, SIM_POSITIONS.slice(0, 1).map((p) => ({ ...p, id: crypto.randomUUID() })));
      } else if (['T1', 'T2', 'T3', 'T4', 'T6', 'T7'].includes(t.id)) {
        setPositions(state, SIM_POSITIONS.slice(0, 4).map((p) => ({ ...p, id: crypto.randomUUID() })));
      } else {
        setPositions(state, []);
      }
      $('#p-symbol').value = t.symbol;
      $('#p-direction').value = t.direction;
      $('#p-entry').value = t.entry;
      $('#p-tp').value = t.tp;
      $('#p-current').value = '';
      showTab('pending');
      showToast(`${t.id} loaded — check result`);
    });
  });
}

function bindEvents() {
  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => showTab(tab.dataset.tab));
  });

  ['p-symbol', 'p-direction', 'p-entry', 'p-tp', 'p-current'].forEach((id) => {
    $(`#${id}`)?.addEventListener('input', renderPending);
    $(`#${id}`)?.addEventListener('change', renderPending);
  });

  $('#btn-save-pending').addEventListener('click', () => {
    const input = getPendingInput();
    const result = evaluatePendingOrder(input, state.settings, state.positions, state.trends, state.pipValues);
    savePendingDraft(state, { ...input, verdict: result.verdict, finalLot: result.finalLot });
    renderPending();
    showToast('Pending check saved');
  });

  $('#position-form').addEventListener('submit', (e) => {
    e.preventDefault();
    addPosition(state, {
      symbol: $('#pos-symbol').value,
      direction: $('#pos-direction').value,
      entry: num($('#pos-entry').value),
      sl: num($('#pos-sl').value),
      lot: num($('#pos-lot').value),
    });
    e.target.reset();
    renderPositions();
    showToast('Position added');
  });

  $('#btn-load-sim').addEventListener('click', () => {
    setPositions(state, SIM_POSITIONS.map((p) => ({ ...p, id: crypto.randomUUID() })));
    renderPositions();
    showToast('Sim positions loaded (6 trades)');
  });

  $('#btn-clear-pos').addEventListener('click', () => {
    if (!confirm('Clear all open positions?')) return;
    setPositions(state, []);
    renderPositions();
    showToast('Positions cleared');
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

function initSymbolSelects() {
  const opts = SYMBOLS.map((s) => `<option value="${s}">${s}</option>`).join('');
  $('#p-symbol').innerHTML = opts;
  $('#pos-symbol').innerHTML = opts;
  $('#p-symbol').value = 'AUDUSD';
}

bindEvents();
initSymbolSelects();
showTab('pending');

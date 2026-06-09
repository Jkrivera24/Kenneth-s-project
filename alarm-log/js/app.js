import {
  STATUSES,
  loadAlarms,
  upsertAlarm,
  deleteAlarm,
  emptyAlarm,
  getAlarm,
} from './storage.js';
import { downloadCsv, parseCsv } from './csv.js';

const $ = (sel) => document.querySelector(sel);

let currentId = null;

function badgeClass(status) {
  const map = {
    'IN PROGRESS': 'progress',
    CLEARED: 'cleared',
    RESET: 'reset',
    DONE: 'done',
    RECURRING: 'recurring',
  };
  return map[status] || 'progress';
}

function showToast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function showTab(name) {
  $('#tabs').classList.toggle('hidden', name === 'detail');
  $('#fab-new').classList.toggle('hidden', name === 'detail');
  document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
  if (name === 'detail') {
    $('#panel-detail').classList.add('active');
    return;
  }
  $(`#panel-${name}`).classList.add('active');
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === name);
  });
}

function renderList() {
  const alarms = loadAlarms();
  const el = $('#alarm-list');
  if (!alarms.length) {
    el.innerHTML = '<p class="empty">No alarms yet. Tap + to add one.</p>';
    return;
  }
  el.innerHTML = alarms
    .map(
      (a) => `
    <article class="card" data-id="${a.id}">
      <div class="card-top">
        <h3>${esc(a.equipment || a.as_shown_on_hmi || a.id)}</h3>
        <span class="badge ${badgeClass(a.status)}">${esc(a.status)}</span>
      </div>
      <p class="card-meta">${esc(a.id)} · ${esc(a.system || '—')} · ${esc(a.date_time || '')}</p>
    </article>`
    )
    .join('');

  el.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => openDetail(card.dataset.id));
  });
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderForm(alarm) {
  const form = $('#alarm-form');
  form.innerHTML = `
    <div class="form-group">
      <label>Status — tap one</label>
      <div class="status-grid" id="status-grid">
        ${STATUSES.map(
          (s) =>
            `<button type="button" class="status-btn${alarm.status === s ? ' selected' : ''}" data-status="${s}">${s}</button>`
        ).join('')}
      </div>
    </div>
    <div class="form-group"><label>ID</label><input name="id" value="${esc(alarm.id)}" readonly></div>
    <div class="form-group"><label>Date / time</label><input name="date_time" value="${esc(alarm.date_time)}"></div>
    <div class="form-group"><label>System</label><input name="system" value="${esc(alarm.system)}" placeholder="ICMS / PCMECR"></div>
    <div class="form-group"><label>Equipment</label><input name="equipment" value="${esc(alarm.equipment)}"></div>
    <div class="form-group"><label>Alarm tags (use ; between)</label><input name="alarm_tags" value="${esc(alarm.alarm_tags)}"></div>
    <div class="form-group"><label>As shown on HMI</label><textarea name="as_shown_on_hmi">${esc(alarm.as_shown_on_hmi)}</textarea></div>
    <div class="form-group"><label>Steps tried</label><div class="steps-list" id="steps-preview">${esc(alarm.steps_tried || '—')}</div>
      <div class="step-row"><input id="new-step" placeholder="Add a step…"><button type="button" class="btn btn-primary" id="btn-add-step" style="width:auto;padding:12px 16px;margin:0">Add</button></div>
      <textarea name="steps_tried" class="hidden">${esc(alarm.steps_tried)}</textarea>
    </div>
    <div class="form-group"><label>Not in the manual</label><textarea name="not_in_manual">${esc(alarm.not_in_manual)}</textarea></div>
    <div class="form-group"><label>Root cause</label><input name="root_cause" value="${esc(alarm.root_cause)}"></div>
    <div class="form-group"><label>Notes</label><textarea name="notes">${esc(alarm.notes)}</textarea></div>
    <button type="submit" class="btn btn-primary">Save</button>
    <button type="button" class="btn btn-danger" id="btn-delete">Delete alarm</button>
  `;

  const statusInput = { value: alarm.status };
  $('#status-grid').querySelectorAll('.status-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      statusInput.value = btn.dataset.status;
      $('#status-grid').querySelectorAll('.status-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  $('#btn-add-step').addEventListener('click', () => {
    const input = $('#new-step');
    const text = input.value.trim();
    if (!text) return;
    const ta = form.querySelector('[name="steps_tried"]');
    const existing = ta.value.trim();
    const n = (existing.match(/^\d+\./gm) || []).length + 1;
    const line = existing ? `${existing} | ${n}. ${text}` : `${n}. ${text}`;
    ta.value = line;
    $('#steps-preview').textContent = line;
    input.value = '';
  });

  form.onsubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    data.status = statusInput.value;
    upsertAlarm(data);
    showToast('Saved');
    currentId = data.id;
    renderList();
    openDetail(data.id, false);
  };

  $('#btn-delete').addEventListener('click', () => {
    if (!confirm('Delete this alarm?')) return;
    deleteAlarm(alarm.id);
    showTab('list');
    renderList();
  });
}

function openDetail(id, push = true) {
  const alarm = getAlarm(id);
  if (!alarm) return;
  currentId = id;
  $('#detail-title').textContent = alarm.equipment || alarm.id;
  renderForm(alarm);
  showTab('detail');
}

$('#btn-back').addEventListener('click', () => {
  showTab('list');
  renderList();
});

$('#fab-new').addEventListener('click', () => {
  const alarm = emptyAlarm();
  upsertAlarm(alarm);
  openDetail(alarm.id);
});

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    showTab(tab.dataset.tab);
    if (tab.dataset.tab === 'list') renderList();
  });
});

$('#btn-export').addEventListener('click', () => {
  downloadCsv(loadAlarms());
  showToast('CSV downloaded — upload to GitHub when ready');
});

$('#btn-import').addEventListener('click', () => $('#file-import').click());

$('#file-import').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  const alarms = parseCsv(text);
  if (!alarms.length) {
    alert('No alarms found in that file.');
    return;
  }
  localStorage.setItem('alarm-log-v1', JSON.stringify(alarms));
  renderList();
  showToast(`Imported ${alarms.length} alarm(s)`);
  e.target.value = '';
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

renderList();
showTab('list');

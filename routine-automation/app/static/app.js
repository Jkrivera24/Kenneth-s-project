const routinesEl = document.getElementById('routines');
const progressFill = document.querySelector('.progress-bar .fill');
const progressLabel = document.getElementById('progress-label');
const pendingBox = document.getElementById('pending');
const pendingList = document.getElementById('pending-list');
const phoneEventsEl = document.getElementById('phone-events');
const webhookUrlEl = document.getElementById('webhook-url');

document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

webhookUrlEl.textContent = `${location.origin}/api/phone/event`;
document.getElementById('copy-webhook').addEventListener('click', async () => {
  await navigator.clipboard.writeText(webhookUrlEl.textContent);
});

async function loadDashboard() {
  const res = await fetch('/api/dashboard');
  const data = await res.json();

  let total = 0;
  let done = 0;
  routinesEl.innerHTML = '';

  for (const routine of data.routines) {
    for (const step of routine.steps) {
      total += 1;
      if (step.completed) done += 1;
    }

    const block = document.createElement('div');
    block.className = 'routine-block';
    block.innerHTML = `<h2>${escapeHtml(routine.name)} <span>${routine.period}</span></h2>`;
    const stepsWrap = document.createElement('div');

    for (const step of routine.steps) {
      const row = document.createElement('div');
      row.className = `step${step.completed ? ' done' : ''}`;
      row.innerHTML = `
        <span class="step-time">${step.scheduled_time || '—'}</span>
        <span class="step-title">${escapeHtml(step.title)}</span>
        <div class="step-actions">
          ${step.completed ? '' : `<button class="btn small complete-btn" data-id="${step.id}">Done</button>`}
          <button class="btn small qr-btn" data-id="${step.id}">QR</button>
        </div>
      `;
      stepsWrap.appendChild(row);
    }
    block.appendChild(stepsWrap);
    routinesEl.appendChild(block);
  }

  const pct = total ? Math.round((done / total) * 100) : 0;
  progressFill.style.width = `${pct}%`;
  progressLabel.textContent = `${done} of ${total} steps complete today (${pct}%)`;

  if (data.pending_reminders.length) {
    pendingBox.classList.remove('hidden');
    pendingList.innerHTML = data.pending_reminders
      .map((p) => `<li><strong>${escapeHtml(p.routine)}</strong>: ${escapeHtml(p.title)}</li>`)
      .join('');
  } else {
    pendingBox.classList.add('hidden');
  }

  phoneEventsEl.innerHTML = data.recent_phone_events.length
    ? data.recent_phone_events
        .map((e) => `<li>${escapeHtml(e.event_type)} — ${escapeHtml(e.received_at?.slice(0, 19) || '')}</li>`)
        .join('')
    : '<li>No phone events yet</li>';

  routinesEl.querySelectorAll('.complete-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await fetch(`/api/steps/${btn.dataset.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'web' }),
      });
      loadDashboard();
    });
  });

  routinesEl.querySelectorAll('.qr-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const res = await fetch(`/api/steps/${btn.dataset.id}/qr`);
      const qr = await res.json();
      const w = window.open('', '_blank', 'width=320,height=400');
      w.document.write(`
        <html><body style="font-family:sans-serif;text-align:center;padding:1rem;background:#111;color:#eee">
        <p>Scan to complete step</p>
        <img src="data:image/png;base64,${qr.qr_png_base64}" width="240" />
        <p style="font-size:12px;word-break:break-all">${qr.url}</p>
        </body></html>
      `);
    });
  });
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

document.getElementById('import-btn').addEventListener('click', async () => {
  const status = document.getElementById('import-status');
  try {
    const body = JSON.parse(document.getElementById('import-json').value);
    const res = await fetch('/api/phone/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    status.textContent = `Imported ${data.imported_steps} step(s).`;
    status.style.color = 'var(--success)';
    loadDashboard();
  } catch (e) {
    status.textContent = 'Invalid JSON or import failed.';
    status.style.color = '#ff6b6b';
  }
});

loadDashboard();
setInterval(loadDashboard, 60000);

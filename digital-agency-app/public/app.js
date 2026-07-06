const statusBar = document.getElementById('statusBar');
const latestBatchEl = document.getElementById('latestBatch');
const historyEl = document.getElementById('history');
const generateBtn = document.getElementById('generateNowBtn');

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
}

function renderStatus(status) {
  const parts = [];
  parts.push(status.anthropicConfigured ? '✅ מפתח Claude מוגדר' : '⚠️ מפתח Claude חסר');
  parts.push(
    status.socialMode === 'facebook'
      ? '✅ מחובר לפייסבוק/אינסטגרם אמיתי'
      : 'ℹ️ במצב דמו לרשתות חברתיות (אין עדיין חיבור אמיתי)'
  );
  if (status.scheduler.lastRunAt) {
    parts.push(`ריצה אחרונה: ${formatTime(status.scheduler.lastRunAt)}`);
  }
  if (status.scheduler.lastError) {
    parts.push(`שגיאה אחרונה: ${status.scheduler.lastError}`);
  }
  statusBar.textContent = parts.join(' · ');
  statusBar.className = `status-bar ${status.anthropicConfigured ? 'ok' : 'warn'}`;
}

function renderBatch(batch) {
  if (!batch) return '<p class="muted">אין עדיין תוכן.</p>';

  const posts = (batch.postIdeas || [])
    .map(
      (p) => `
      <div class="post-card">
        <span class="platform-tag">${p.platform || 'כללי'}</span>
        <h3>${escapeHtml(p.title || '')}</h3>
        <div class="caption">${escapeHtml(p.captionText || '')}</div>
        <div class="hashtags">${(p.hashtags || []).map((h) => escapeHtml(h)).join(' ')}</div>
        ${
          p.graphicPrompt
            ? `<div class="graphic-prompt">
                 <strong>🎨 רעיון לגרפיקה:</strong> ${escapeHtml(p.graphicPrompt.description || '')}
                 ${p.graphicPrompt.styleNotes ? `<br><em>${escapeHtml(p.graphicPrompt.styleNotes)}</em>` : ''}
               </div>`
            : ''
        }
      </div>`
    )
    .join('');

  const listening = batch.socialListening || {};
  const flagged = (listening.flaggedComments || [])
    .map(
      (c) => `
      <div class="flagged-comment">
        <span class="author">${escapeHtml(c.author || '')}</span> (${escapeHtml(c.platform || '')}):
        <div>${escapeHtml(c.text || '')}</div>
        <div class="reason">🔎 ${escapeHtml(c.reason || '')}</div>
        ${c.suggestedAction ? `<div class="muted">המלצה: ${escapeHtml(c.suggestedAction)}</div>` : ''}
      </div>`
    )
    .join('');

  return `
    <p class="muted">נוצר ב-${formatTime(batch.createdAt)} · מקור נתונים: ${batch.socialSource}</p>
    ${posts}
    <h3>ניטור רשתות חברתיות</h3>
    <div class="trend-summary">${escapeHtml(listening.trendSummary || 'אין סיכום')}</div>
    ${flagged || '<p class="muted">אין תגובות שסומנו כחשובות.</p>'}
  `;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadStatus() {
  const res = await fetch('/api/status');
  renderStatus(await res.json());
}

async function loadBatches() {
  const res = await fetch('/api/batches?limit=20');
  const batches = await res.json();
  latestBatchEl.innerHTML = renderBatch(batches[0]);
  historyEl.innerHTML = batches
    .map(
      (b) =>
        `<div class="history-item" data-id="${b.id}">${formatTime(b.createdAt)} — ${
          (b.postIdeas || []).length
        } רעיונות</div>`
    )
    .join('') || '<p class="muted">אין היסטוריה עדיין.</p>';

  historyEl.querySelectorAll('.history-item').forEach((el) => {
    el.addEventListener('click', async () => {
      const res = await fetch(`/api/batches/${el.dataset.id}`);
      latestBatchEl.innerHTML = renderBatch(await res.json());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

async function refreshAll() {
  await Promise.all([loadStatus(), loadBatches()]);
}

generateBtn.addEventListener('click', async () => {
  generateBtn.disabled = true;
  generateBtn.textContent = '⏳ יוצר תוכן...';
  try {
    const res = await fetch('/api/generate', { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      alert(`שגיאה: ${err.error}`);
    }
    await refreshAll();
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = '✨ צור תוכן עכשיו';
  }
});

refreshAll();
setInterval(refreshAll, 60_000);

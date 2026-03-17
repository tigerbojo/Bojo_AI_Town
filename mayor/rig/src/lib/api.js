/**
 * Gas Town API - fetches and parses dashboard data from upstream gt dashboard
 * via Vite proxy at /gt-source/
 */

function parseMayor(doc) {
  const banner = doc.querySelector('.mayor-banner');
  const isAttached = banner?.classList.contains('attached') ?? false;

  const activityEl = doc.querySelector('.mayor-stat-value.idle, .mayor-stat-value');
  const runtimeEl = doc.querySelectorAll('.mayor-stat-value')[1];

  return {
    status: isAttached ? 'attached' : 'detached',
    activity: activityEl?.textContent?.trim() ?? null,
    runtime: runtimeEl?.textContent?.trim() ?? null,
  };
}

function parseSummary(doc) {
  const stats = {};
  doc.querySelectorAll('.summary-stats .stat').forEach(el => {
    const label = el.querySelector('.stat-label')?.textContent?.replace(/[🦨🪝📋🚚⚠️💓]/gu, '').trim();
    const value = el.querySelector('.stat-value')?.textContent?.trim();
    if (label && value) stats[label] = value;
  });

  const alerts = [];
  doc.querySelectorAll('.alert-item').forEach(el => {
    alerts.push(el.textContent.trim());
  });

  const noHeartbeat = !!doc.querySelector('.stat.unhealthy');

  return {
    polecats: parseInt(stats['Polecats'], 10) || 0,
    hooks: parseInt(stats['Hooks'], 10) || 0,
    work: parseInt(stats['Work'], 10) || 0,
    convoys: parseInt(stats['Convoys'], 10) || 0,
    escalations: parseInt(stats['Escalations'], 10) || 0,
    noHeartbeat,
    alerts,
  };
}

function parsePolecats(doc) {
  const polecats = [];
  const panel = doc.querySelector('.panel:has(h2)');

  // Find the polecats panel (h2 contains "Polecats")
  let polecatPanel = null;
  doc.querySelectorAll('.panel').forEach(p => {
    if (p.querySelector('h2')?.textContent?.includes('Polecats')) polecatPanel = p;
  });

  const rows = (polecatPanel ?? doc).querySelectorAll('tr.polecat-idle, tr.polecat-working, tr.polecat-hooked');

  rows.forEach(row => {
    const cells = Array.from(row.querySelectorAll('td'));
    if (cells.length < 4) return;

    const name = cells[0].querySelector('.polecat-name')?.textContent?.trim() ?? '';
    const type = cells[1].querySelector('.badge')?.textContent?.trim() ?? '';
    const rig = cells[2].querySelector('.polecat-rig')?.textContent?.trim() ?? '';
    const issue = cells[3].querySelector('.no-issue') ? null : cells[3].textContent?.trim();
    const status = cells[4]?.querySelector('.badge')?.textContent?.trim() ?? 'Idle';
    const activityCell = cells[5];
    const activityColor = activityCell?.className ?? '';
    const activity = activityCell?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

    polecats.push({ name, type, rig, issue, status, activity, activityColor });
  });

  return polecats;
}

function parseSessions(doc) {
  const sessions = [];

  doc.querySelectorAll('tr.session-row').forEach(row => {
    const cells = Array.from(row.querySelectorAll('td'));
    if (cells.length < 2) return;

    const sessionName = row.getAttribute('data-session-name') ?? '';
    const role = cells[0]?.textContent?.trim() ?? '';
    const rig = cells[1]?.textContent?.trim() ?? '';
    const worker = cells[2]?.textContent?.trim() ?? '';
    const activity = cells[3]?.textContent?.trim() ?? '';

    sessions.push({ sessionName, role, rig, worker, activity });
  });

  return sessions;
}

export async function fetchDashboardData() {
  const res = await fetch('/gt-source/', { headers: { Accept: 'text/html' } });
  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const mayor = parseMayor(doc);
  const summary = parseSummary(doc);
  const polecats = parsePolecats(doc);
  const sessions = parseSessions(doc);

  return { mayor, summary, polecats, sessions, fetchedAt: new Date().toISOString() };
}

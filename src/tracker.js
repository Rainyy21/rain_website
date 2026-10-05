// Cookieless, first-party tracking. Requests go to /api/t/* on the same domain.
let visitSent = false;
const off = () => import.meta.env.DEV || navigator.doNotTrack === '1';

function send(url, body) {
  const data = JSON.stringify(body);
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([data], { type: 'application/json' }))) return;
  } catch (e) { /* fall through to fetch */ }
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data, keepalive: true }).catch(() => {});
}

export function trackVisit() {
  if (visitSent || off()) return;
  visitSent = true;
  send('/api/t/visit', { ref: document.referrer });
}

export function trackClick(link) {
  if (off()) return;
  send('/api/t/click', { link });
}

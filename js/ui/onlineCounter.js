/**
 * Simulates live player count fluctuation on the home screen.
 * Replace with a real WebSocket event in production.
 */

const BASE_COUNT    = 24;
const FLUCTUATION   = 7;
const INTERVAL_MS   = 4000;

export function initOnlineCounter(elementId = 'online-count') {
  const el = document.getElementById(elementId);
  if (!el) return;

  setInterval(() => {
    const delta = Math.floor(Math.random() * FLUCTUATION) - Math.floor(FLUCTUATION / 2);
    el.textContent = Math.max(8, BASE_COUNT + delta);
  }, INTERVAL_MS);
}

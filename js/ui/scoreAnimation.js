/**
 * Animates a score element from 0 up to the target value.
 */

const STEPS    = 40;
const DURATION = 1000; // ms

export function animateScore(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;

  let current  = 0;
  const step   = target / STEPS;
  const delay  = DURATION / STEPS;

  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.round(current);
    if (current >= target) clearInterval(interval);
  }, delay);
}

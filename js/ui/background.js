/**
 * Floating glyph background effect.
 * Spawns <span> elements that slowly float upward via CSS animation.
 */

const CHARS  = 'TRANSLATEÇŞÖÜĞIABCDEFGHIJKLMNOPRSTUVYZ';
const COUNT  = 10;
const SPEED  = { min: 18, max: 40 }; // seconds

export function initBackground(containerId = 'bg-glyphs') {
  const container = document.getElementById(containerId);
  if (!container) return;

  for (let i = 0; i < COUNT; i++) {
    const span = document.createElement('span');
    span.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
    span.style.left              = `${Math.random() * 100}vw`;
    span.style.animationDuration = `${SPEED.min + Math.random() * (SPEED.max - SPEED.min)}s`;
    span.style.animationDelay   = `${-(Math.random() * SPEED.max)}s`;
    container.appendChild(span);
  }
}

/**
 * GameTimer — encapsulates the 60-second countdown.
 * Updates the SVG ring and the numeric display each tick.
 * Calls onExpire when the counter reaches zero.
 */

const TOTAL_SECONDS  = 60;
const RING_CIRCUMFERENCE = 2 * Math.PI * 20; // r=20 → 125.664
const URGENT_THRESHOLD   = 10;

export class GameTimer {
  #seconds   = TOTAL_SECONDS;
  #interval  = null;
  #onExpire  = null;

  // DOM refs
  #numEl  = null;
  #ringEl = null;

  constructor({ numEl, ringEl, onExpire }) {
    this.#numEl   = numEl;
    this.#ringEl  = ringEl;
    this.#onExpire = onExpire;
  }

  start() {
    this.#seconds = TOTAL_SECONDS;
    this.#render();
    this.#interval = setInterval(() => this.#tick(), 1000);
  }

  stop() {
    clearInterval(this.#interval);
    this.#interval = null;
  }

  reset() {
    this.stop();
    this.#seconds = TOTAL_SECONDS;
    this.#render();
  }

  /* ── private ── */

  #tick() {
    this.#seconds--;
    this.#render();
    if (this.#seconds <= 0) {
      this.stop();
      this.#onExpire?.();
    }
  }

  #render() {
    const t       = this.#seconds;
    const offset  = RING_CIRCUMFERENCE * (1 - t / TOTAL_SECONDS);
    const urgent  = t <= URGENT_THRESHOLD;

    this.#numEl.textContent = t;
    this.#ringEl.style.strokeDashoffset = offset;

    this.#numEl.classList.toggle('urgent',  urgent);
    this.#ringEl.classList.toggle('urgent', urgent);
  }
}

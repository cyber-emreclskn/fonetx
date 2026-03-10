/**
 * Screen transition manager.
 * Each screen is a `.screen` element identified by id.
 * Active screen gets `.active`; exiting screen gets `.exit` for the CSS out-animation.
 */

const TRANSITION_MS = 210;

export function navigateTo(screenId) {
  const current = document.querySelector('.screen.active');

  if (current) {
    current.classList.add('exit');
    setTimeout(() => current.classList.remove('active', 'exit'), TRANSITION_MS * 2);
  }

  setTimeout(() => {
    document.getElementById(screenId).classList.add('active');
  }, TRANSITION_MS);
}

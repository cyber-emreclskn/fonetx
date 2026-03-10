import { setState }        from '../state.js';
import { navigateTo }      from '../router.js';
import { startMatchmaking } from './matchmaking.js';

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export function initHome() {
  document.getElementById('play-btn').addEventListener('click', handlePlay);
  document.getElementById('username-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handlePlay();
  });
}

function handlePlay() {
  const input    = document.getElementById('username-input');
  const errorEl  = document.getElementById('username-error');
  const username = input.value.trim();

  if (!USERNAME_PATTERN.test(username)) {
    errorEl.classList.add('show');
    input.focus();
    return;
  }

  errorEl.classList.remove('show');
  setState({ username });
  startMatchmaking(username);
}

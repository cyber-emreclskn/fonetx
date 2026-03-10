import { setState } from '../state.js';
import { navigateTo } from '../router.js';
import { startGame } from './game.js';

const OPPONENTS = ['KORAY_99', 'MERT_X', 'ZEYNEP_07', 'AHMET42', 'SEL1N', 'ALPER', 'DOGAN_TR'];
const SEARCH_DELAY_MS = { min: 2200, max: 3800 };

export function startMatchmaking(username) {
  resetUI();
  setSelfSlot(username);
  navigateTo('screen-matchmaking');

  const delay = SEARCH_DELAY_MS.min + Math.random() * (SEARCH_DELAY_MS.max - SEARCH_DELAY_MS.min);
  setTimeout(onMatchFound, delay);
}

/* ── private ── */

function setSelfSlot(username) {
  document.getElementById('self-avatar').textContent = username.slice(0, 2).toUpperCase();
  document.getElementById('self-name').textContent   = username.toUpperCase();
}

function resetUI() {
  const oppSlot = document.getElementById('opp-slot');
  oppSlot.className = 'player-slot unknown';
  document.getElementById('opp-avatar').textContent    = '?';
  document.getElementById('opp-name').textContent      = 'ARANYOR…';
  document.getElementById('mm-title').textContent      = 'RAKİP ARANYOR';
  document.getElementById('search-wrap').style.display = 'flex';
  document.getElementById('found-banner').style.display = 'none';
}

function onMatchFound() {
  const opponent = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
  setState({ opponentName: opponent });

  revealOpponent(opponent);
  showFoundBanner();

  setTimeout(() => {
    startGame();
    navigateTo('screen-game');
  }, 1400);
}

function revealOpponent(name) {
  const slot = document.getElementById('opp-slot');
  slot.className = 'player-slot found';
  document.getElementById('opp-avatar').textContent = name.slice(0, 2).toUpperCase();
  document.getElementById('opp-name').textContent   = name;
  document.getElementById('mm-title').textContent   = 'RAKİP BULUNDU!';
  document.getElementById('search-wrap').style.display = 'none';
}

function showFoundBanner() {
  const banner = document.getElementById('found-banner');
  banner.style.display = 'block';
}

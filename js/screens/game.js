import { getState, setState } from '../state.js';
import { navigateTo } from '../router.js';
import { calcScore } from '../scoring.js';
import { speak } from '../tts.js';
import { GameTimer } from '../timer.js';
import { showResult } from './result.js';
import { transliterate } from '../scoring.js';

const WORDS = [
  'bahçe', 'çiçek', 'güneş', 'şeker', 'köprü', 'rüzgar',
  'ağaç',  'müzik', 'özgür', 'yıldız', 'çocuk', 'gökyüzü',
  'şarkı', 'büyük', 'küçük', 'gözlük', 'üzüm', 'çorba',
];

const OPP_SUBMIT_RANGE_S = { min: 20, max: 50 };

let timer = null;

export function startGame() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  setState({ currentWord: word });

  renderWord(word);
  resetInput();
  resetListenButton();
  renderOpponentBar();
  scheduleOpponentSubmit();
  startTimer();
}

export function initGame() {
  document.getElementById('listen-btn').addEventListener('click', handleListen);
  document.getElementById('submit-btn').addEventListener('click', () => handleSubmit(false));
  document.getElementById('answer-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSubmit(false);
  });
}

/* ── handlers ── */

function handleListen() {
  const { currentWord } = getState();
  const btn = document.getElementById('listen-btn');

  speak(currentWord, {
    onStart: () => btn.classList.add('playing'),
    onEnd:   () => btn.classList.remove('playing'),
  });
}

export function handleSubmit(isAutoSubmit) {
  timer?.stop();
  document.getElementById('submit-btn').disabled = true;

  const { currentWord, username, opponentName } = getState();
  const answer    = document.getElementById('answer-input').value.trim().toLowerCase();
  const myScore   = calcScore(answer, currentWord);
  const oppScore  = simulateOpponentScore();
  const oppAnswer = simulateOpponentAnswer(currentWord);

  showResult({
    currentWord,
    username,
    opponentName,
    myAnswer:  answer,
    myScore,
    oppAnswer,
    oppScore,
  });

  navigateTo('screen-result');
}

/* ── private helpers ── */

function startTimer() {
  timer = new GameTimer({
    numEl:    document.getElementById('timer-num'),
    ringEl:   document.getElementById('ring-fill'),
    onExpire: () => handleSubmit(true),
  });
  timer.start();
}

function renderWord(word) {
  document.getElementById('game-word').textContent = word;
}

function resetInput() {
  const input = document.getElementById('answer-input');
  input.value    = '';
  input.disabled = false;
  document.getElementById('submit-btn').disabled = false;
}

function resetListenButton() {
  const btn = document.getElementById('listen-btn');
  btn.classList.remove('playing');
  btn.disabled = false;
}

function renderOpponentBar() {
  const { opponentName } = getState();
  document.getElementById('opp-bar-name').textContent = opponentName;

  const statusEl = document.getElementById('opp-status');
  statusEl.className   = 'opp-status typing';
  statusEl.innerHTML   = `<span>●</span> yazıyor<span class="blink-dots"><span>.</span><span>.</span><span>.</span></span>`;
}

function scheduleOpponentSubmit() {
  const { min, max } = OPP_SUBMIT_RANGE_S;
  const delay = (min + Math.random() * (max - min)) * 1000;

  setTimeout(() => {
    const el = document.getElementById('opp-status');
    if (!el) return;
    el.className = 'opp-status submitted';
    el.textContent = '✓ GÖNDERDİ';
  }, delay);
}

function simulateOpponentScore() {
  return 35 + Math.floor(Math.random() * 58);
}

function simulateOpponentAnswer(word) {
  const base = transliterate(word);
  const mutations = [
    (s) => s.replace('ch', 'c'),
    (s) => s.replace('sh', 's'),
    (s) => s + 'e',
    (s) => s.slice(0, -1),
    (s) => s.replace(/o/g, 'oe'),
    (s) => s,
  ];
  const mutate = mutations[Math.floor(Math.random() * mutations.length)];
  return mutate(base) || base;
}

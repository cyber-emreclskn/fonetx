import { navigateTo } from '../router.js';
import { startMatchmaking } from './matchmaking.js';
import { animateScore } from '../ui/scoreAnimation.js';
import { getState } from '../state.js';
import { speakEnglish } from '../tts.js';

let _lastAnswer = '';

/**
 * @param {object} result
 * @param {string} result.username
 * @param {string} result.opponentName
 * @param {string} result.myAnswer
 * @param {number} result.myScore
 * @param {number} result.oppScore
 */
export function showResult(result) {
  const { username, opponentName, myAnswer, myScore, oppScore } = result;

  _lastAnswer = (myAnswer ?? '').trim();

  renderOutcome(myScore, oppScore);
  renderScoreBlocks({ username, myScore, opponentName, oppScore });

  // Show / hide the listen button depending on whether there is an answer
  const listenBtn = document.getElementById('listen-answer-btn');
  if (listenBtn) listenBtn.style.display = _lastAnswer ? '' : 'none';

  // Score count-up animation
  setTimeout(() => {
    animateScore('p1-score', myScore);
    animateScore('p2-score', oppScore);
  }, 280);
}

export function initResult() {
  document.getElementById('play-again-btn').addEventListener('click', handlePlayAgain);
  document.getElementById('main-menu-btn').addEventListener('click', () => navigateTo('screen-home'));
  document.getElementById('listen-answer-btn').addEventListener('click', () => {
    if (_lastAnswer) speakEnglish(_lastAnswer);
  });
}

/* ── private ── */

function renderOutcome(myScore, oppScore) {
  const el = document.getElementById('outcome-title');

  if (myScore > oppScore) {
    el.textContent = 'KAZANDIN!';
    el.className   = 'outcome-title win';
  } else if (myScore < oppScore) {
    el.textContent = 'KAYBETTİN';
    el.className   = 'outcome-title lose';
  } else {
    el.textContent = 'BERABERE';
    el.className   = 'outcome-title draw';
  }
}

function renderScoreBlocks({ username, myScore, opponentName, oppScore }) {
  const p1 = document.getElementById('p1-block');
  const p2 = document.getElementById('p2-block');

  document.getElementById('p1-name').textContent  = username.toUpperCase();
  document.getElementById('p1-score').textContent = '0';

  document.getElementById('p2-name').textContent  = opponentName;
  document.getElementById('p2-score').textContent = '0';

  const iWin   = myScore > oppScore;
  const isDraw = myScore === oppScore;

  p1.className = isDraw ? 'score-block' : iWin ? 'score-block winner' : 'score-block loser';
  p2.className = isDraw ? 'score-block' : iWin ? 'score-block loser'  : 'score-block winner';
}

function handlePlayAgain() {
  const { username } = getState();
  startMatchmaking(username);
}

/**
 * Application entry point.
 * Imports each module and wires up the app.
 */

import { initBackground }    from './ui/background.js';
import { initOnlineCounter }  from './ui/onlineCounter.js';
import { initHome }           from './screens/home.js';
import { initGame }           from './screens/game.js';
import { initResult }         from './screens/result.js';
import { navigateTo }         from './router.js';

function init() {
  initBackground('bg-glyphs');
  initOnlineCounter('online-count');
  initHome();
  initGame();
  initResult();

  // Cancel matchmaking
  document.getElementById('cancel-mm-btn')
    ?.addEventListener('click', () => navigateTo('screen-home'));
}

// Run after DOM is ready
document.addEventListener('DOMContentLoaded', init);

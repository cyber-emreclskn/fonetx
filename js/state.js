/**
 * Single source of truth for the current match session.
 * All mutations go through the exported setters — never mutate directly.
 */

const state = {
  username:     '',
  opponentName: '',
  currentWord:  '',
};

export const getState = () => ({ ...state });

export const setState = (patch) => {
  Object.assign(state, patch);
};

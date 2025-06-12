// src/game.js
import fs from 'fs';
import path from 'path';

// Allowed directions with vector deltas
const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };

/**
 * Loads game state from JSON file.
 */
export function loadState(filePath = path.resolve('data/game.json')) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Saves game state to JSON file.
 */
export function saveState(state, filePath = path.resolve('data/game.json')) {
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
}

/**
 * Moves the snake, updates score and handles collisions.
 * @param {Object} state
 * @param {string} dir - one of 'U','D','L','R'
 * @param {string} username
 * @returns {{state: Object, didEat: boolean, didDie: boolean}}
 */
export function move(state, dir, username) {
  if (!DIRS[dir]) return { state, didEat: false, didDie: false };
  const now = Date.now();
  state.moveCooldown = state.moveCooldown || {};
  if (state.moveCooldown[username] && now - state.moveCooldown[username] < 3600000) {
    return { state, didEat: false, didDie: false };
  }
  state.moveCooldown[username] = now;
  state.scores = state.scores || {};
  state.scores[username] = (state.scores[username] || 0) + 0.1;
  const [dx, dy] = DIRS[dir];
  const head = state.snake[state.snake.length - 1];
  const newHead = [head[0] + dx, head[1] + dy];
  const w = 11, h = 11;
  let didEat = false, didDie = false;
  const key = pos => `${pos[0]},${pos[1]}`;
  const bodySet = new Set(state.snake.map(key));
  // Check wall or self-collision
  if (newHead[0] < 0 || newHead[0] >= w || newHead[1] < 0 || newHead[1] >= h || bodySet.has(key(newHead))) {
    didDie = true;
    const L = state.snake.length;
    state.scores[username] += Math.floor(L / 2);
    // reset snake to center length 3
    state.snake = [[5,4],[5,5],[5,6]];
    state.food = spawnFood(state.snake, w, h);
  } else {
    state.snake.push(newHead);
    // Check food collision
    if (newHead[0] === state.food[0] && newHead[1] === state.food[1]) {
      didEat = true;
      state.scores[username] += 1;
      if (state.lastFedBy === username) state.scores[username] += 1;
      state.lastFedBy = username;
      state.food = spawnFood(state.snake, w, h);
    } else {
      state.snake.shift();
    }
  }
  return { state, didEat, didDie };
}

// TODO: helper to choose a random food location not on the snake
function spawnFood(snake, width, height) {
  // TODO: implement random spawn on empty cell
  return [Math.floor(width/2), Math.floor(height/2)];
}

/**
 * Moves the snake based on the current game state and a direction.
 * @param {Object} gameState
 * @param {string} direction
 * @returns {Object} new game state
 */
export function move(gameState, direction) {
  // TODO: implement snake move logic
  throw new Error("move() not implemented");
}

/**
 * Calculates the current score based on game state.
 * @param {Object} gameState
 * @returns {number}
 */
export function score(gameState) {
  // TODO: calculate score
  throw new Error("score() not implemented");
}

/**
 * Resets the game to its initial state.
 * @returns {Object} initial game state
 */
export function reset() {
  // TODO: reset game state
  throw new Error("reset() not implemented");
}

#!/usr/bin/env node
import { loadState, move, spawnFood } from './src/game.js';

console.log('Testing game logic...');
let state = loadState();
console.log('Initial state:', JSON.stringify(state, null, 2));

console.log('\nTesting move up...');
const result = move(state, 'U', 'testplayer');
console.log('Result:', result);
console.log('New state snake:', result.state.snake);
console.log('New scores:', result.state.scores);

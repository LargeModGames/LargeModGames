#!/usr/bin/env node
import fs from 'fs';
import { loadState, saveState } from './src/game.js';
import { render } from './src/renderer.js';

console.log('Generating initial board...');
const state = loadState();
const buffer = render(state);
const outFile = 'board-initial.png';
fs.writeFileSync(outFile, buffer);
console.log(`Generated ${outFile}`);

// Update README with the initial board
const readmeFile = 'README.md';
let readme = fs.readFileSync(readmeFile, 'utf-8');
const imgTag = `<img src="${outFile}?raw=true" alt="Snake Board">`;
const status = 'Ready to play! Comment `/move U` to start moving up.';
const replacement = `<!-- SNAKE-BOARD-START -->\n${imgTag}\n\n${status}\n<!-- SNAKE-BOARD-END -->`;
readme = readme.replace(/<!-- SNAKE-BOARD-START -->[\s\S]*<!-- SNAKE-BOARD-END -->/, replacement);
fs.writeFileSync(readmeFile, readme);
console.log('Updated README.md');

#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { loadState, saveState, move } from '../src/game.js';
import { render } from '../src/renderer.js';
import { getNewMoves } from '../src/github.js';
import { execSync } from 'child_process';

async function main() {
  const dataFile = path.resolve(process.cwd(), 'data/game.json');
  const readmeFile = path.resolve(process.cwd(), 'README.md');
  let state = loadState(dataFile);
  state.lastMoveAt = state.lastMoveAt || new Date(0).toISOString();

  // fetch new moves
  const moves = await getNewMoves(state.lastMoveAt);
  if (moves.length === 0) {
    console.log('No new moves.');
    return;
  }
  const { username, dir, timestamp } = moves[0];
  const { state: newState, didEat, didDie } = move(state, dir, username);
  newState.lastMoveAt = timestamp;
  let logMessage = '';
  if (didEat) logMessage += `${username} ate food! `;
  if (didDie) logMessage += `${username} died! `;
  // TODO: enhance log messages or aggregate multiple moves

  saveState(newState, dataFile);

  // render and save image
  const outFile = `board-${Date.now()}.png`;
  const buffer = render(newState);
  fs.writeFileSync(path.resolve(process.cwd(), outFile), buffer);

  // update README
  let readme = fs.readFileSync(readmeFile, 'utf-8');
  const imgTag = `<img src="${outFile}?raw=true" alt="Snake Board">`;
  const status = logMessage || 'Awaiting next move...';
  const replacement = `<!-- SNAKE-BOARD-START -->\n${imgTag}\n\n${status}\n<!-- SNAKE-BOARD-END -->`;
  readme = readme.replace(/<!-- SNAKE-BOARD-START -->[\s\S]*<!-- SNAKE-BOARD-END -->/, replacement);
  fs.writeFileSync(readmeFile, readme);

  // commit and push changes
  execSync(`git add ${outFile} ${readmeFile} data/game.json`, { stdio: 'inherit' });
  execSync(`git commit -m "chore: update board"`, { stdio: 'inherit' });
  execSync(`git push`, { stdio: 'inherit' });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

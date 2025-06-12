#!/usr/bin/env node
// .github/run.mjs
import fs from 'fs';
import path from 'path';
import { move, score, reset } from '../src/game.js';
import { render } from '../src/renderer.js';
import { fetchMoves } from '../src/github.js';

async function run() {
  const dataPath = path.resolve(process.cwd(), 'data/game.json');
  let gameState = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // TODO: fetch moves from GitHub
  // const moves = await fetchMoves({ owner: 'USERNAME', repo: 'REPO', issue_number: ISSUE });
  const moves = [];

  for (const { user, move: dir } of moves) {
    gameState = move(gameState, dir);
  }

  // TODO: update scores
  // const currentScore = score(gameState);

  // TODO: write updated state
  // fs.writeFileSync(dataPath, JSON.stringify(gameState, null, 2));

  // render board
  const outPath = path.resolve(process.cwd(), 'snake.png');
  render(gameState, outPath);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

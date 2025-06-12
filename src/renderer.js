// src/renderer.js
// TODO: draw 11×11 PNG board + leaderboard
import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';

const BOARD_SIZE = 11;
const CELL_SIZE = 20;
const CANVAS_SIZE = BOARD_SIZE * CELL_SIZE;

/**
 * Renders the game state to a PNG file.
 * @param {Object} gameState
 * @param {string} outputPath
 */
export function render(gameState, outputPath) {
  const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE + 100); // extra for leaderboard
  const ctx = canvas.getContext('2d');

  // TODO: draw board and snake
  
  // TODO: draw leaderboard below

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
}

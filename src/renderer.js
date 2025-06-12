// src/renderer.js
// TODO: draw 11×11 PNG board + leaderboard
import { createCanvas } from "@napi-rs/canvas";

// Grid configuration
const BOARD_SIZE = 11;
const CELL_SIZE = 16;
const SCORE_AREA = 50;
const WIDTH = BOARD_SIZE * CELL_SIZE;
const HEIGHT = WIDTH + SCORE_AREA;

/**
 * Renders the game state to a PNG buffer.
 * @param {Object} state
 * @returns {Buffer}
 */
export function render(state) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // background
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // walls border
  if (state.meta?.hasWalls) {
    ctx.strokeStyle = "#6e7681";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, WIDTH, WIDTH);
  }
  // draw snake body
  ctx.fillStyle = "#39ff14";
  state.snake.slice(0, -1).forEach(([x, y]) => {
    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  });
  // draw snake head (brighter/different color)
  if (state.snake.length > 0) {
    const [headX, headY] = state.snake[state.snake.length - 1];
    ctx.fillStyle = "#00bfff"; // bright blue for head
    ctx.fillRect(headX * CELL_SIZE, headY * CELL_SIZE, CELL_SIZE, CELL_SIZE);

    // add a small dot in the center of the head for extra clarity
    ctx.fillStyle = "#ffffff";
    const centerX = headX * CELL_SIZE + CELL_SIZE / 2;
    const centerY = headY * CELL_SIZE + CELL_SIZE / 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  // draw food
  const [fx, fy] = state.food;
  ctx.fillStyle = "#ff3860";
  ctx.fillRect(fx * CELL_SIZE, fy * CELL_SIZE, CELL_SIZE, CELL_SIZE);

  // boss outline
  if (state.meta?.hasBoss && state.meta.bossPos) {
    const [bx, by] = state.meta.bossPos;
    ctx.strokeStyle = "#6e7681";
    ctx.lineWidth = 2;
    ctx.strokeRect(bx * CELL_SIZE, by * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  }

  // leaderboard text (top 5)
  const entries = Object.entries(state.scores || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const textLines = entries.map(([user, sc]) => `${user}: ${Math.floor(sc)}`);
  ctx.fillStyle = "#ffffff";
  ctx.font = "8px sans-serif"; // TODO: replace with bitmap font mapping if desired
  const lineHeight = 10;
  const totalHeight = textLines.length * lineHeight;
  let y = WIDTH + (SCORE_AREA - totalHeight) / 2 + lineHeight;
  textLines.forEach((line) => {
    const w = ctx.measureText(line).width;
    ctx.fillText(line, (WIDTH - w) / 2, y);
    y += lineHeight;
  });

  return canvas.toBuffer("image/png");
}

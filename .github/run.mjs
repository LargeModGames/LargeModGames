#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { loadState, saveState, move } from "../src/game.js";
import { render } from "../src/renderer.js";
import { getNewMoves } from "../src/github.js";
import { execSync } from "child_process";

async function main() {
  console.log("=== Snake Arcade Runner Started ===");
  console.log("Environment:", {
    GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN ? "SET" : "NOT SET",
  });

  const dataFile = path.resolve(process.cwd(), "data/game.json");
  const readmeFile = path.resolve(process.cwd(), "README.md");
  console.log("Loading state from:", dataFile);

  let state = loadState(dataFile);
  state.lastMoveAt = state.lastMoveAt || new Date(0).toISOString();
  console.log("Current state:", JSON.stringify(state, null, 2));
  console.log("Looking for moves since:", state.lastMoveAt);
  // fetch new moves
  console.log("Fetching new moves...");
  const moves = await getNewMoves(state.lastMoveAt);
  console.log("Found moves:", moves);

  // Filter out moves that are not actually newer than lastMoveAt
  const newerMoves = moves.filter(
    (move) => new Date(move.timestamp) > new Date(state.lastMoveAt)
  );
  console.log("Newer moves:", newerMoves);

  if (newerMoves.length === 0) {
    console.log("No new moves found. Exiting.");
    return;
  }  // Process ALL new moves in chronological order
  let currentState = state;
  let lastTimestamp = state.lastMoveAt;
  let totalLogMessage = '';
  
  for (const { username, dir, timestamp } of newerMoves) {
    console.log(`Processing move: ${username} -> ${dir} at ${timestamp}`);
    
    const { state: newState, didEat, didDie } = move(currentState, dir, username);
    currentState = newState;
    lastTimestamp = timestamp;
    
    let moveLog = '';
    if (didEat) moveLog += `${username} ate food! `;
    if (didDie) moveLog += `${username} died! `;
    if (!didEat && !didDie) moveLog += `${username} moved ${dir}. `;
    
    totalLogMessage += moveLog;
    console.log("Move result:", { didEat, didDie });
  }
  
  currentState.lastMoveAt = lastTimestamp;  saveState(currentState, dataFile);
  console.log("State saved.");
  // render and save image (use timestamped filename to avoid all caching)
  const outFile = `snake-board-${Date.now()}.png`;
  console.log("Rendering board to:", outFile);
  const buffer = render(currentState);
  fs.writeFileSync(path.resolve(process.cwd(), outFile), buffer);
  console.log("Board image generated.");

  // update README
  console.log("Updating README...");
  let readme = fs.readFileSync(readmeFile, "utf-8");
  const imgTag = `<img src="${outFile}?raw=true" alt="Snake Board">`;
  const status = totalLogMessage.trim() || 'Awaiting next move...';
  const replacement = `<!-- SNAKE-BOARD-START -->\n${imgTag}\n\n${status}\n<!-- SNAKE-BOARD-END -->`;
  readme = readme.replace(
    /<!-- SNAKE-BOARD-START -->[\s\S]*<!-- SNAKE-BOARD-END -->/,
    replacement
  );
  fs.writeFileSync(readmeFile, readme);
  console.log("README updated.");
  // commit and push changes
  console.log("Committing changes...");
  try {
    // Remove old board files to keep repo clean
    execSync(`git rm snake-board*.png 2>nul || true`, { stdio: "inherit" });
    execSync(`git add ${outFile} ${readmeFile} data/game.json`, {
      stdio: "inherit",
    });
    execSync(`git commit -m "chore: update board - ${status}"`, {
      stdio: "inherit",
    });
    execSync(`git push`, { stdio: "inherit" });
    console.log("Changes pushed successfully.");
  } catch (error) {
    console.error("Error during git operations:", error.message);    throw error;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

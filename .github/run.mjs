#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { loadState, saveState, move } from "../src/game.js";
import { render } from "../src/renderer.js";
import { getNewMoves } from "../src/github.js";
import { execSync } from "child_process";
import { Octokit } from '@octokit/rest';

// Initialize Octokit for star gates and error reporting
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

// TODO: Helper function to post error comments to Issue #1
async function postErrorComment(error) {
  try {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: 1,
      body: `🐛 **Game Error**: ${error.message}\n\n\`\`\`\n${error.stack}\n\`\`\``
    });
    console.log("Error comment posted to Issue #1");
  } catch (commentError) {
    console.error("Failed to post error comment:", commentError.message);
  }
}

// TODO: Helper function to check and unlock star gates
async function checkStarGates(state) {
  let hasNewUnlocks = false;
  let starComments = [];
  
  try {
    const { data: repo } = await octokit.rest.repos.get({ owner, repo });
    const starCount = repo.stargazers_count;
    console.log(`Current star count: ${starCount}`);
    
    // Initialize meta if it doesn't exist
    if (!state.meta) {
      state.meta = { unlockedStarGates: [] };
    }
    if (!state.meta.unlockedStarGates) {
      state.meta.unlockedStarGates = [];
    }
    
    const starGates = [
      { threshold: 100, feature: "Speed Boost", message: "🌟 **100 Stars Unlocked!** The snake can now move faster!" },
      { threshold: 250, feature: "Power Pellets", message: "⭐ **250 Stars Unlocked!** Special power pellets now appear!" },
      { threshold: 500, feature: "Boss Mode", message: "✨ **500 Stars Unlocked!** Boss battles are now enabled!" }
    ];
    
    for (const gate of starGates) {
      if (starCount >= gate.threshold && !state.meta.unlockedStarGates.includes(gate.threshold)) {
        state.meta.unlockedStarGates.push(gate.threshold);
        starComments.push(gate.message);
        hasNewUnlocks = true;
        console.log(`Star gate unlocked: ${gate.threshold} stars - ${gate.feature}`);
      }
    }
    
    // Post star gate comments to Issue #1
    for (const comment of starComments) {
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: 1,
        body: comment
      });
      console.log("Star gate comment posted");
    }
    
  } catch (error) {
    console.error("Error checking star gates:", error.message);
  }
  
  return hasNewUnlocks;
}

// TODO: Helper function to generate comprehensive leaderboard
function generateLeaderboard(state) {
  const scores = state.scores || {};
  const entries = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15); // Top 15 players
  
  if (entries.length === 0) {
    return "No players yet! Be the first to make a move! 🎮";
  }
  
  let leaderboard = "| Rank | Player | Score | Status |\n";
  leaderboard += "|------|--------|-------|--------|\n";
  
  const cooldowns = state.moveCooldown || {};
  const now = Date.now();
  
  entries.forEach(([username, score], index) => {
    const rank = index + 1;
    const displayScore = Math.floor(score * 10) / 10; // Round to 1 decimal
    
    // Determine status
    let status = "🟢 Ready";
    if (cooldowns[username]) {
      const timeLeft = Math.max(0, 30000 - (now - cooldowns[username]));
      if (timeLeft > 0) {
        const secondsLeft = Math.ceil(timeLeft / 1000);
        status = `⏳ ${secondsLeft}s`;
      }
    }
    
    // Add medal emojis for top 3
    let rankDisplay = rank.toString();
    if (rank === 1) rankDisplay = "🥇 1";
    else if (rank === 2) rankDisplay = "🥈 2";
    else if (rank === 3) rankDisplay = "🥉 3";
    
    // Special highlight for the current snake controller (last successful mover)
    const isCurrentPlayer = state.lastFedBy === username;
    const playerName = isCurrentPlayer ? `**${username}** 🐍` : username;
    
    leaderboard += `| ${rankDisplay} | ${playerName} | ${displayScore} | ${status} |\n`;
  });
  
  // Add stats footer
  const totalPlayers = Object.keys(scores).length;
  const totalMoves = Object.values(scores).reduce((sum, score) => sum + Math.floor(score * 10), 0);
  const snakeLength = state.snake ? state.snake.length : 3;
  
  leaderboard += "\n";
  leaderboard += `📊 **Game Stats**: ${totalPlayers} players • ${totalMoves} total moves • Snake length: ${snakeLength}\n`;
  leaderboard += `🎯 **Current Goal**: Reach the food at position (${state.food ? state.food.join(', ') : 'unknown'})\n`;    // Add achievement info if star gates are unlocked
  if (state.meta && state.meta.unlockedStarGates && state.meta.unlockedStarGates.length > 0) {
    const achievements = [];
    if (state.meta.unlockedStarGates.includes(100)) achievements.push("🌟 Speed Boost");
    if (state.meta.unlockedStarGates.includes(250)) achievements.push("⭐ Power Pellets");
    if (state.meta.unlockedStarGates.includes(500)) achievements.push("✨ Boss Mode");
    
    if (achievements.length > 0) {
      leaderboard += `🏆 **Unlocked Features**: ${achievements.join(" • ")}\n`;
    }
  } else {
    leaderboard += `🌟 **Star this repo to unlock special features!** (See milestones above)\n`;
  }
  
  return leaderboard;
}

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
  
  // Check star gates first
  const hasStarUpdates = await checkStarGates(state);
  
  // fetch new moves
  console.log("Fetching new moves...");
  const moves = await getNewMoves(state.lastMoveAt);
  console.log("Found moves:", moves);

  // Filter out moves that are not actually newer than lastMoveAt
  const newerMoves = moves.filter(
    (move) => new Date(move.timestamp) > new Date(state.lastMoveAt)
  );
  console.log("Newer moves:", newerMoves);

  if (newerMoves.length === 0 && !hasStarUpdates) {
    console.log("No new moves or star updates found. Exiting.");
    return;
  } 
  
  // Process ALL new moves in chronological order
  let currentState = state;
  let lastTimestamp = state.lastMoveAt;
  let totalLogMessage = "";
  for (const { username, dir, timestamp } of newerMoves) {
    console.log(`Processing move: ${username} -> ${dir} at ${timestamp}`);
    
    const {
      state: newState,
      didEat,
      didDie,
      deathReason,
    } = move(currentState, dir, username);
    currentState = newState;
    lastTimestamp = timestamp;

    let moveLog = "";
    if (didEat) moveLog += `${username} ate food! `;
    if (didDie) {
      if (deathReason === 'wall') {
        moveLog += `${username} hit a wall and died! `;
      } else if (deathReason === 'self') {
        moveLog += `${username} ran into themselves and died! `;
      } else {
        moveLog += `${username} died! `;
      }
    }
    if (!didEat && !didDie) moveLog += `${username} moved ${dir}. `;

    totalLogMessage += moveLog;
    console.log("Move result:", { didEat, didDie, deathReason });
  }

  // Update timestamp only if we processed moves
  if (newerMoves.length > 0) {
    currentState.lastMoveAt = lastTimestamp;
  }
  
  // Save state (includes star gate updates and/or move updates)
  saveState(currentState, dataFile);
  console.log("State saved.");
  
  // render and save image (use timestamped filename to avoid all caching)
  const outFile = `snake-board-${Date.now()}.png`;
  console.log("Rendering board to:", outFile);
  const buffer = render(currentState);
  fs.writeFileSync(path.resolve(process.cwd(), outFile), buffer);
  console.log("Board image generated.");  // update README
  console.log("Updating README...");
  let readme = fs.readFileSync(readmeFile, "utf-8");
  const imgTag = `<img src="${outFile}?raw=true" alt="Snake Board">`;
  const status = totalLogMessage.trim() || "Awaiting next move...";
  const boardReplacement = `<!-- SNAKE-BOARD-START -->\n${imgTag}\n\n${status}\n<!-- SNAKE-BOARD-END -->`;
  
  // Update game board section
  readme = readme.replace(
    /<!-- SNAKE-BOARD-START -->[\s\S]*<!-- SNAKE-BOARD-END -->/,
    boardReplacement
  );
  
  // Update star progress if we have star count info
  let starCount = 0;
  try {
    const { data: repo } = await octokit.rest.repos.get({ owner, repo });
    starCount = repo.stargazers_count;
    
    // Update star progress in the README
    const nextMilestone = starCount >= 500 ? 500 : starCount >= 250 ? 500 : starCount >= 100 ? 250 : 100;
    const progressText = `**Current Progress**: ⭐ ${starCount} / ${nextMilestone} stars *(Check back for updates!)*`;
    
    readme = readme.replace(
      /\*\*Current Progress\*\*: ⭐ \d+ \/ \d+ stars \*\(Check back for updates!\)\*/,
      progressText
    );
    
    console.log(`Updated star progress: ${starCount}/${nextMilestone}`);
  } catch (error) {
    console.error("Could not fetch star count for README update:", error.message);
  }
  
  // Generate and update leaderboard section
  const leaderboardContent = generateLeaderboard(currentState);
  const leaderboardReplacement = `## Leaderboard

${leaderboardContent}`;
  
  // Replace the leaderboard section (from ## Leaderboard to end of file)
  readme = readme.replace(
    /## Leaderboard[\s\S]*$/,
    leaderboardReplacement
  );
  
  fs.writeFileSync(readmeFile, readme);
  console.log("README updated with new leaderboard and star progress.");
  
  // commit and push changes (only once at the end)
  console.log("Committing changes...");
  try {
    // Remove old board files to keep repo clean
    execSync(`git rm snake-board*.png 2>nul || true`, { stdio: "inherit" });
    execSync(`git add ${outFile} ${readmeFile} data/game.json`, {
      stdio: "inherit",
    });
    
    let commitMessage = "chore: update board";
    if (hasStarUpdates && totalLogMessage.trim()) {
      commitMessage += ` - star gates + ${status}`;
    } else if (hasStarUpdates) {
      commitMessage += " - star gate unlocks";
    } else if (totalLogMessage.trim()) {
      commitMessage += ` - ${status}`;
    }
    
    execSync(`git commit -m "${commitMessage}"`, {
      stdio: "inherit",
    });
    execSync(`git push`, { stdio: "inherit" });
    console.log("Changes pushed successfully.");
  } catch (error) {
    console.error("Error during git operations:", error.message);
    throw error;
  }
}

// Wrap main() in try/catch for error handling
main().catch(async (error) => {
  console.error("=== Game Error ===");
  console.error(error);
  
  // Post error comment to Issue #1
  await postErrorComment(error);
  
  // Exit with error code
  process.exit(1);
});

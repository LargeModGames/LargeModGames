#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { loadState } from "./src/game.js";

// Generate test leaderboard function (copied from run.mjs)
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
  leaderboard += `🎯 **Current Goal**: Reach the food at position (${state.food ? state.food.join(', ') : 'unknown'})\n`;
  
  // Add achievement info if star gates are unlocked
  if (state.meta) {
    const achievements = [];
    if (state.meta.hasWalls) achievements.push("🧱 Walls");
    if (state.meta.hasGolden) achievements.push("✨ Golden Apple");
    if (state.meta.hasBoss) achievements.push("🔥 Boss Mode");
    
    if (achievements.length > 0) {
      leaderboard += `🏆 **Unlocked Features**: ${achievements.join(" • ")}\n`;
    }
  }
  
  return leaderboard;
}

// Test updating the actual README
const state = loadState("./data/game.json");
const readmeFile = "README.md";
let readme = fs.readFileSync(readmeFile, "utf-8");

// Generate and update leaderboard section
const leaderboardContent = generateLeaderboard(state);
const leaderboardReplacement = `## Leaderboard

${leaderboardContent}`;

// Replace the leaderboard section (from ## Leaderboard to end of file)
readme = readme.replace(
  /## Leaderboard[\s\S]*$/,
  leaderboardReplacement
);

console.log("Updated README preview:");
console.log("=".repeat(80));
console.log(readme.split('## Leaderboard')[1]);
console.log("=".repeat(80));

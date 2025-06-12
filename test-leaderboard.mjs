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

// Test the leaderboard with more players
const state = loadState("./data/game.json");

// Add some test players to see a fuller leaderboard
state.scores = {
  "LargeModGames": 15.7,
  "testuser": 12.3,
  "snake_master": 11.8,
  "codehero": 10.5,
  "gamedev123": 9.2,
  "pythonista": 8.7,
  "debugger": 7.9,
  "pixelartist": 7.1,
  "gamergirl": 6.8,
  "hackerboy": 6.4,
  "newbie": 3.2,
  "learning": 2.8,
  "firsttime": 1.5,
  "tryinghard": 1.1,
  "beginner": 0.8,
  "casual": 0.5
};

// Set some cooldowns to test status display
state.moveCooldown = {
  "LargeModGames": Date.now() - 25000, // 25 seconds ago (5 seconds left)
  "testuser": Date.now() - 35000, // 35 seconds ago (ready)
  "snake_master": Date.now() - 10000, // 10 seconds ago (20 seconds left)
};

state.lastFedBy = "snake_master"; // Make snake_master the current controller

console.log("Generated Leaderboard:");
console.log("=".repeat(50));
console.log(generateLeaderboard(state));
console.log("=".repeat(50));

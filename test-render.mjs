#!/usr/bin/env node
import fs from "fs";
import { loadState } from "./src/game.js";
import { render } from "./src/renderer.js";

console.log("Testing renderer...");
const state = loadState();
console.log("Loaded state:", state);

const buffer = render(state);
fs.writeFileSync("test-board.png", buffer);
console.log("Generated test-board.png");

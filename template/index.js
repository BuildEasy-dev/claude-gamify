#!/usr/bin/env node

/**
 * Claude Gamify - Main Entry Point
 * Extensible gamification system for Claude Code
 */

const path = require('path');
const { spawn } = require('child_process');

// Parse command line arguments
const [,, ...args] = process.argv;

/**
 * Main entry point
 */
function main() {
  // For now, delegate all calls to play_sound.js
  // In the future, we can add routing logic here for other features
  
  const soundModule = path.resolve(__dirname, 'play_sound.js');
  
  try {
    // Spawn the sound module as a separate process
    const child = spawn('node', [soundModule, ...args], {
      detached: true,
      stdio: 'ignore'
    });
    
    child.unref();
  } catch (error) {
    // Fail silently to avoid disrupting Claude Code
  }
  
  process.exit(0);
}

// Run
main();
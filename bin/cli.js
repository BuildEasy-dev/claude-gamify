#!/usr/bin/env node

/**
 * Claude Gamify - Interactive CLI Manager
 * NPX tool for managing Claude Code gamification system
 */

import { program } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import CLI modules
import { CommandHandlers } from '../lib/cli/command-handlers.js';
import { InteractiveMode } from '../lib/cli/interactive-mode.js';
import { MenuNavigator } from '../lib/ui/prompts.js';
import { MESSAGES, COMMAND_DESCRIPTIONS } from '../lib/ui/constants.js';

// Package information
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
const VERSION = pkg.version;

// Handle Ctrl+C and SIGTERM gracefully
process.on('SIGINT', () => {
  MenuNavigator.clearScreen();
  console.log(chalk.green('\n' + MESSAGES.EXIT));
  process.exit(0);
});

process.on('SIGTERM', () => {
  MenuNavigator.clearScreen();
  console.log(chalk.green('\n' + MESSAGES.EXIT));
  process.exit(0);
});

// CLI Program Configuration
program
  .name('claude-gamify')
  .description('Claude Code gamification system manager')
  .version(VERSION);

// Initialize command
program
  .command('init')
  .description(COMMAND_DESCRIPTIONS.INIT)
  .action(CommandHandlers.handleInit);

// Status command
program
  .command('status')
  .description(COMMAND_DESCRIPTIONS.STATUS)
  .action(CommandHandlers.handleStatus);

// Check for updates command
program
  .command('check-updates')
  .description(COMMAND_DESCRIPTIONS.CHECK_UPDATES)
  .action(async () => {
    const interactive = new InteractiveMode(pkg);
    await CommandHandlers.handleCheckUpdates(
      interactive.checkForUpdatesAsync.bind(interactive),
      VERSION
    );
  });

// Uninstall command
program
  .command('uninstall')
  .description(COMMAND_DESCRIPTIONS.UNINSTALL)
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(CommandHandlers.handleUninstall);

// Default action - show interactive menu
program
  .action(async () => {
    const interactive = new InteractiveMode(pkg);
    await interactive.start();
  });

// Parse command line arguments
program.parse(process.argv);
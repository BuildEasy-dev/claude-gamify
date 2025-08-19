#!/usr/bin/env node

/**
 * Claude Gamify - Interactive CLI Manager
 * NPX tool for managing Claude Code gamification system
 */

const { program } = require('commander');
const chalk = require('chalk');
const boxen = require('boxen');
const inquirer = require('inquirer');
const { ClaudeSound } = require('../lib/claude-sound');

const VERSION = require('../package.json').version;

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.clear();
  console.log(chalk.green('\n👋 Thanks for using Claude Gamify!'));
  process.exit(0);
});

// Also handle SIGTERM
process.on('SIGTERM', () => {
  console.clear();
  console.log(chalk.green('\n👋 Thanks for using Claude Gamify!'));
  process.exit(0);
});

// Utility to create inquirer prompt with ESC key support  
async function promptWithEsc(promptConfig, backValue = 'back') {
  // Add ESC instruction to choices for list prompts (but not for ignore case)
  if (promptConfig.type === 'list' && promptConfig.choices && backValue !== 'ignore') {
    // Check if back option already exists
    const hasBackOption = promptConfig.choices.some(choice => 
      (typeof choice === 'object' && choice.value === backValue) ||
      (typeof choice === 'string' && choice === backValue)
    );
    
    if (!hasBackOption) {
      // Add separator and back option if not exists
      promptConfig.choices.push(
        new inquirer.Separator(),
        { name: 'Back (or press ESC)', value: backValue }
      );
    } else {
      // Update existing back option to mention ESC
      promptConfig.choices = promptConfig.choices.map(choice => {
        if (typeof choice === 'object' && choice.value === backValue) {
          return { ...choice, name: choice.name.replace('Back', 'Back (or press ESC)') };
        }
        return choice;
      });
    }
  }
  
  // Simple keyboard interrupt handling
  const originalListeners = process.stdin.listeners('keypress');
  
  return new Promise((resolve, reject) => {
    const handleKeypress = (str, key) => {
      if (key && key.name === 'escape') {
        if (backValue !== 'ignore') {
          console.log('\n' + chalk.gray('(ESC pressed - going back)'));
        }
        process.stdin.removeListener('keypress', handleKeypress);
        resolve({ [promptConfig.name]: backValue });
        return;
      }
      // Handle Ctrl+C in inquirer context
      if (key && key.ctrl && key.name === 'c') {
        console.clear();
        console.log(chalk.green('\n👋 Thanks for using Claude Gamify!'));
        process.exit(0);
      }
    };
    
    process.stdin.on('keypress', handleKeypress);
    
    inquirer.prompt([promptConfig]).then(answer => {
      process.stdin.removeListener('keypress', handleKeypress);
      resolve(answer);
    }).catch(error => {
      process.stdin.removeListener('keypress', handleKeypress);
      // Handle Ctrl+C interrupt error
      if (error.name === 'ExitPromptError' || error.isTtyError) {
        console.clear();
        console.log(chalk.green('\n👋 Thanks for using Claude Gamify!'));
        process.exit(0);
      }
      reject(error);
    });
  });
}

async function showWelcome() {
  console.clear();
  console.log(
    boxen(
      chalk.bold('Welcome to Claude Gamify!\n\n') +
      chalk.gray('Use arrow keys to navigate, Enter to select, ESC to go back'),
      {
        padding: 1,
        margin: 0,
        borderStyle: 'single',
        borderColor: '#cc785c',
        textAlignment: 'left'
      }
    )
  );
}

async function mainMenu() {
  const manager = new ClaudeSound();
  
  try {
    await manager.initialize();
  } catch (error) {
    if (error.message === 'NOT_INITIALIZED') {
      const { shouldInit } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldInit',
          message: 'No configuration found. Would you like to initialize Claude Gamify?',
          default: true
        }
      ]);
      
      if (shouldInit) {
        try {
          await manager.init();
          console.log(chalk.green('\nSetup Complete!\n'));
          console.log('Claude Gamify has been successfully configured.\n');
          console.log('• Sound hooks are now active in Claude Code');
          console.log('• Default themes have been installed');
          console.log('• You can now manage themes and settings\n');
          console.log(chalk.blue('Tip: Run npx claude-gamify anytime to manage your sound system\n'));
          
          await inquirer.prompt([
            { type: 'input', name: 'continue', message: 'Press Enter to continue...' }
          ]);
        } catch (initError) {
          console.error(chalk.red(`Initialization failed: ${initError.message}`));
          process.exit(1);
        }
      } else {
        console.log(chalk.yellow('Setup cancelled.'));
        process.exit(0);
      }
    } else {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  }

  const choices = [
    { name: 'Themes', value: 'themes' },
    { name: 'Settings', value: 'settings' },
    { name: 'Test Sounds', value: 'test' },
    { name: 'System Info', value: 'info' },
    { name: 'Exit', value: 'exit' }
  ];

  while (true) {
    await showWelcome();
    await manager.showQuickStatus();

    const { action } = await promptWithEsc({
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices,
      pageSize: 10
    }, 'ignore');

    try {
      switch (action) {
        case 'themes':
          await themesMenu(manager);
          break;
        case 'settings':
          await settingsMenu(manager);
          break;
        case 'test':
          await testSounds(manager);
          break;
        case 'info':
          await showSystemInfo(manager);
          break;
        case 'exit':
          console.clear();
          console.log(chalk.green('👋 Thanks for using Claude Gamify!'));
          process.exit(0);
        case 'ignore':
          // ESC pressed on main menu - ignore and continue
          continue;
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      await inquirer.prompt([
        { type: 'input', name: 'continue', message: 'Press Enter to continue...' }
      ]);
    }
  }
}

async function themesMenu(manager) {
  while (true) {
    await showWelcome();
    await manager.showQuickStatus();
    
    const themes = await manager.listThemes();
    const currentTheme = manager.config.sound_theme;

    const choices = themes.map(theme => ({
      name: `${theme.name === currentTheme ? '✓' : ' '} ${theme.name} ${chalk.gray(`(${theme.description || 'No description'})`)}`,
      value: theme.name,
      short: theme.name
    }));

    choices.push(
      new inquirer.Separator(),
      { name: 'Remove Theme', value: 'remove' },
      { name: 'Back', value: 'back' }
    );

    const { choice } = await promptWithEsc({
      type: 'list',
      name: 'choice',
      message: 'Theme Management:',
      choices,
      pageSize: 12
    }, 'back');

    if (choice === 'back') {
      return;
    }
    if (choice === 'remove') {
      await removeThemeFlow(manager);
      continue;
    }

    // Switch theme
    await manager.setTheme(choice);
    // No additional prompt, just continue to refresh the menu
  }
}

async function removeThemeFlow(manager) {
  const themes = await manager.listThemes();
  const removableThemes = themes.filter(t => t.name !== 'default' && t.name !== 'system');
  
  if (removableThemes.length === 0) {
    console.log(chalk.yellow('No custom themes available to remove.'));
    await inquirer.prompt([
      { type: 'input', name: 'continue', message: 'Press Enter to continue...' }
    ]);
    console.clear();
    return;
  }

  const { themeToRemove } = await promptWithEsc({
    type: 'list',
    name: 'themeToRemove',
    message: 'Select theme to remove:',
    choices: [
      ...removableThemes.map(t => ({ name: t.name, value: t.name })),
      new inquirer.Separator(),
      { name: 'Back', value: 'back' }
    ]
  }, 'back');

  if (themeToRemove === 'back') {
    console.clear();
    return;
  }

  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `Are you sure you want to remove theme "${themeToRemove}"?`,
      default: false
    }
  ]);

  if (confirmed) {
    await manager.removeTheme(themeToRemove);
    console.log(chalk.green(`Theme "${themeToRemove}" removed successfully.`));
  }
  
  await inquirer.prompt([
    { type: 'input', name: 'continue', message: 'Press Enter to continue...' }
  ]);
  console.clear();
}

async function settingsMenu(manager) {
  while (true) {
    await showWelcome();
    await manager.showQuickStatus();
    
    const config = manager.config;

    const { setting } = await promptWithEsc({
      type: 'list',
      name: 'setting',
      message: 'Settings:',
      choices: [
        {
          name: `Volume: ${chalk.yellow((config.sound_volume * 100).toFixed(0) + '%')}`,
          value: 'volume'
        },
        {
          name: `Sound: ${config.sound_enabled ? chalk.green('Enabled') : chalk.red('Disabled')}`,
          value: 'toggle'
        },
        new inquirer.Separator(),
        { name: 'Back', value: 'back' }
      ]
    }, 'back');

    switch (setting) {
      case 'volume':
        await adjustVolumeFlow(manager);
        break;
      case 'toggle':
        await manager.toggleSound();
        // No additional prompt, just continue to refresh the menu
        break;
      case 'back':
        return;
    }
  }
}

async function adjustVolumeFlow(manager) {
  // Clear screen to avoid any leftover text
  console.clear();
  
  const result = await promptWithEsc({
    type: 'input',
    name: 'volume',
    message: `Current volume: ${(manager.config.sound_volume * 100).toFixed(0)}%. Enter new volume (0-100):`,
    validate: (input) => {
      // Check if input contains decimal point or other invalid characters
      if (input.includes('.') || !/^\d+$/.test(input)) {
        return 'Please enter a whole number between 0 and 100';
      }
      const num = parseInt(input);
      if (isNaN(num) || num < 0 || num > 100) {
        return 'Please enter a number between 0 and 100';
      }
      return true;
    }
  }, 'cancel');
  
  if (result.volume === 'cancel') return;

  await manager.setVolume(parseInt(result.volume) / 100);

  // Play test sound
  await manager.testSingleSound('Notification');
}


async function testSounds(manager) {
  const hooks = [
    'SessionStart',
    'UserPromptSubmit', 
    'PreToolUse',
    'PostToolUse',
    'Notification',
    'Stop',
    'SubagentStop'
  ];

  const { choice } = await promptWithEsc({
    type: 'list',
    name: 'choice',
    message: 'Test Sounds:',
    choices: [
      { name: 'Test All Sounds', value: 'all' },
      new inquirer.Separator(),
      ...hooks.map(hook => ({ name: hook, value: hook })),
      new inquirer.Separator(),
      { name: 'Back', value: 'back' }
    ],
    loop: false
  }, 'back');

  if (choice === 'back') {
    console.clear();
    return;
  }

  if (choice === 'all') {
    console.log(chalk.blue('Testing all sounds...'));
    for (const hook of hooks) {
      console.log(chalk.gray(`Playing ${hook}...`));
      await manager.testSingleSound(hook);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    console.log(chalk.green('All sounds tested!'));
  } else {
    console.log(chalk.blue(`Playing ${choice}...`));
    await manager.testSingleSound(choice);
  }

  await inquirer.prompt([
    { type: 'input', name: 'continue', message: 'Press Enter to continue...' }
  ]);
}

async function showSystemInfo(manager) {
  const info = await manager.getSystemInfo();
  
  console.log(chalk.cyan('System Information\n'));
  console.log(`Platform: ${chalk.yellow(info.platform)}`);
  console.log(`Node.js: ${chalk.yellow(info.nodeVersion)}`);
  console.log(`Claude Gamify: ${chalk.yellow(info.version)}`);
  console.log(`Config Path: ${chalk.gray(info.configPath)}`);
  console.log(`Themes Path: ${chalk.gray(info.themesPath)}`);
  console.log(`Available Players: ${chalk.yellow(info.audioPlayers.join(', ') || 'None found')}`);
  console.log(`Current Theme: ${chalk.green(info.currentTheme)}`);
  console.log(`Sound Status: ${info.soundEnabled ? chalk.green('Enabled') : chalk.red('Disabled')}`);
  console.log(`Volume: ${chalk.yellow((info.volume * 100).toFixed(0) + '%')}`);
  
  await inquirer.prompt([
    { type: 'input', name: 'continue', message: 'Press Enter to continue...' }
  ]);
}

// CLI Commands
program
  .name('claude-gamify')
  .description('Claude Code gamification system manager')
  .version(VERSION);

program
  .command('init')
  .description('Initialize Claude Gamify system')
  .action(async () => {
    const manager = new ClaudeSound();
    try {
      await manager.init();
      console.log(chalk.green('Claude Gamify initialized successfully!'));
    } catch (error) {
      console.error(chalk.red(`Initialization failed: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show current status')
  .action(async () => {
    const manager = new ClaudeSound();
    try {
      await manager.initialize();
      await manager.showQuickStatus();
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Default action - show interactive menu
program
  .action(async () => {
    await mainMenu();
  });

// Parse command line arguments
program.parse(process.argv);
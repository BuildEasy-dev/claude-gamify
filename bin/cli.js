#!/usr/bin/env node

/**
 * Claude Gamify - Interactive CLI Manager
 * NPX tool for managing Claude Code gamification system
 */

const { program } = require('commander');
const chalk = require('chalk');
const boxen = require('boxen');
const figlet = require('figlet');
const inquirer = require('inquirer');
const ora = require('ora');
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
  
  // Generate ASCII art
  // Available font options: Standard, Big, Slant, Small, Script, Shadow, 
  // Banner3-D, Doom, Ghost, Graceful, Graffiti, Larry 3D, Poison, Speed, 
  // Stop, Thin, 3D-ASCII, 3D Diagonal, Alphabet, Banner, Banner3, Banner4,
  // Bubble, Digital, Epic, Fire Font-s, Isometric1-4, Lean, Letters, 
  // Merlin1, Modular, Ogre, Pagga, Rectangle, Roman, Rounded, Rowan Cap,
  // Small Slant, Stellar, Univers, Weird
  const asciiArt = figlet.textSync('Claude Gamify', {
    font: 'Small',
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 60,
    whitespaceBreak: true
  });
  
  // Display everything in one boxen with matching colors
  console.log(
    boxen(
      chalk.hex('#cc785c')(asciiArt) + '\n\n' +
      chalk.bold('Welcome to Claude Gamify!\n\n') +
      chalk.gray('Use arrow keys to navigate, Enter to select, ESC to go back'),
      {
        padding: 1,
        margin: 0,
        borderStyle: 'single',
        borderColor: '#cc785c',
        textAlignment: 'center'
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
    new inquirer.Separator(),
    { name: 'Uninstall', value: 'uninstall' },
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
        case 'uninstall':
          await uninstallFlow(manager);
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
    const currentTheme = manager.config.theme;

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

async function uninstallFlow(manager) {
  console.clear();
  
  // Show warning box
  console.log(
    boxen(
      chalk.red('⚠️  Uninstall Claude Gamify\n\n') +
      chalk.yellow('This will remove ALL Claude Gamify files and settings:\n') +
      chalk.gray('  • ~/.claude-gamify/ (all sound files & configuration)\n') +
      chalk.gray('  • ~/.claude/output-styles/<theme>.md (theme styles)\n') + 
      chalk.gray('  • Hook configurations from Claude Code settings\n') +
      chalk.gray('  • Reset output style if using gamify theme'),
      {
        padding: 1,
        margin: 0,
        borderStyle: 'single',
        borderColor: 'red'
      }
    )
  );

  // Confirmation prompt
  const { confirmUninstall } = await inquirer.prompt([
    {
      type: 'input',
      name: 'confirmUninstall',
      message: chalk.green('Are you sure you want to completely uninstall Claude Gamify? (y/N)'),
      default: 'N',
      validate: (input) => {
        const normalized = input.toLowerCase().trim();
        if (['y', 'yes', 'n', 'no', ''].includes(normalized)) {
          return true;
        }
        return 'Please enter y/yes or n/no';
      }
    }
  ]);

  if (!['y', 'yes'].includes(confirmUninstall.toLowerCase())) {
    console.log(chalk.yellow('\n✨ Uninstall cancelled'));
    await inquirer.prompt([
      { type: 'input', name: 'continue', message: 'Press Enter to return to menu...' }
    ]);
    return;
  }


  // Execute uninstall
  const spinner = ora('Uninstalling Claude Gamify...').start();
  
  try {
    const result = await manager.uninstall();
    
    if (result.success) {
      spinner.succeed('Claude Gamify has been completely uninstalled');
      
      
      console.log(chalk.gray('\nRemoved:'));
      console.log(chalk.gray(`  • ${result.removedHooks} hook configurations`));
      console.log(chalk.gray(`  • ${result.removedStyles.length} output style files`));
      console.log(chalk.gray('  • All local installation files'));
      
      console.log(chalk.blue('\n👋 Thank you for using Claude Gamify!'));
      console.log(chalk.gray('You can reinstall anytime with: npx claude-gamify'));
    } else {
      spinner.warn('Uninstall completed with some errors');
      
      if (result.errors.length > 0) {
        console.log(chalk.yellow('\n⚠️  Some operations failed:'));
        result.errors.forEach(err => {
          console.log(chalk.gray(`  • ${err}`));
        });
      }
    }
  } catch (error) {
    spinner.fail(`Uninstall failed: ${error.message}`);
  }
  
  // Exit after uninstall
  process.exit(0);
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

program
  .command('uninstall')
  .description('Completely uninstall Claude Gamify')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (options) => {
    const manager = new ClaudeSound();
    
    // Check if initialized
    try {
      await manager.initialize();
    } catch (error) {
      console.log(chalk.yellow('Claude Gamify is not installed.'));
      process.exit(0);
    }
    
    if (!options.yes) {
      // Interactive confirmation
      const { confirmUninstall } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmUninstall',
          message: 'Are you sure you want to completely uninstall Claude Gamify?',
          default: false
        }
      ]);
      
      if (!confirmUninstall) {
        console.log(chalk.yellow('Uninstall cancelled'));
        process.exit(0);
      }
    }
    
    console.log('Uninstalling Claude Gamify...');
    
    try {
      const result = await manager.uninstall();
      
      if (result.success) {
        console.log(chalk.green('✅ Uninstalled successfully'));
        
        
        console.log(chalk.gray(`Removed ${result.removedHooks} hooks and ${result.removedStyles.length} styles`));
      } else {
        console.log(chalk.yellow('⚠️  Uninstall had some errors:'));
        result.errors.forEach(err => console.log(chalk.gray(`  • ${err}`)));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Uninstall failed: ${error.message}`));
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
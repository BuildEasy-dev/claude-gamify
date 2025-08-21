#!/usr/bin/env node

/**
 * Claude Gamify - Interactive CLI Manager
 * NPX tool for managing Claude Code gamification system
 */

import { program } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ClaudeSound } from '../lib/claude-sound.js';
import updateNotifier from 'update-notifier';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import UI modules
import { 
  MESSAGES, 
  PROMPTS, 
  UPDATE_CONFIG,
  SOUND_TEST,
  HOOK_NAMES,
  COMMAND_DESCRIPTIONS,
  MENU_CONFIG
} from '../lib/ui/constants.js';
import { 
  WelcomeScreen, 
  StatusBar, 
  SystemInfoDisplay,
  LoadingSpinner,
  MessageBox,
  ThemeListDisplay,
  UninstallWarning,
  VersionCheckDisplay
} from '../lib/ui/components.js';
import { PromptManager, MenuNavigator } from '../lib/ui/prompts.js';

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


async function showWelcome(updateInfo = null) {
  WelcomeScreen.render(updateInfo);
}

async function checkForUpdatesAsync() {
  const notifier = updateNotifier({
    pkg,
    updateCheckInterval: UPDATE_CONFIG.CHECK_INTERVAL,
    shouldNotifyInNpmScript: UPDATE_CONFIG.SHOULD_NOTIFY_IN_NPM_SCRIPT,
    defer: UPDATE_CONFIG.DEFER
  });
  
  if (notifier.update) {
    const executionContext = detectExecutionContext();
    return {
      currentVersion: notifier.update.current,
      latestVersion: notifier.update.latest,
      executionContext: executionContext,
      updateAvailable: true
    };
  }
  
  return null;
}

// Detect execution context similar to our old VersionManager
function detectExecutionContext() {
  // NPX execution - check if npm_execpath contains 'npx'
  if (process.env.npm_execpath && process.env.npm_execpath.includes('npx')) {
    return 'npx';
  }

  // Global installation - check npm_config_global
  if (process.env.npm_config_global === 'true') {
    return 'global';
  }

  // Local installation - default case
  return 'local';
}

async function mainMenu() {
  const manager = new ClaudeSound();
  
  // Start version check in parallel with initialization
  const updateCheckPromise = checkForUpdatesAsync();
  
  try {
    await manager.initialize();
  } catch (error) {
    if (error.message === 'NOT_INITIALIZED') {
      const shouldInit = await PromptManager.confirmAction(
        PROMPTS.NO_CONFIG_FOUND,
        true
      );
      
      if (shouldInit) {
        try {
          await manager.init();
          console.log(chalk.green('\n' + MESSAGES.SETUP_COMPLETE + '\n'));
          console.log('Claude Gamify has been successfully configured.\n');
          console.log('• Sound hooks are now active in Claude Code');
          console.log('• Default themes have been installed');
          console.log('• You can now manage themes and settings\n');
          console.log(chalk.blue('Tip: Run npx claude-gamify anytime to manage your sound system\n'));
          
          await PromptManager.pressEnterToContinue();
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

  // Get update info once at start
  let updateInfo = null;
  try {
    updateInfo = await updateCheckPromise;
  } catch (error) {
    // Silently ignore upgrade check errors
  }

  while (true) {
    await showWelcome(updateInfo);
    const config = manager.configManager.getConfig();
    StatusBar.render(config);

    const { action } = await PromptManager.promptWithEsc({
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices,
      pageSize: MENU_CONFIG.PAGE_SIZE
    }, MENU_CONFIG.IGNORE_BACK_VALUE);

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
          MenuNavigator.clearScreen();
          console.log(chalk.green(MESSAGES.EXIT));
          process.exit(0);
        case MENU_CONFIG.IGNORE_BACK_VALUE:
          // ESC pressed on main menu - ignore and continue
          continue;
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      await PromptManager.pressEnterToContinue();
    }
  }
}

async function themesMenu(manager) {
  while (true) {
    await showWelcome();
    const config = manager.configManager.getConfig();
    StatusBar.render(config);
    
    const themes = await manager.listThemes();
    const currentTheme = config.theme;

    const choices = ThemeListDisplay.formatChoices(themes, currentTheme);

    choices.push(
      new inquirer.Separator(),
      { name: 'Remove Theme', value: 'remove' },
      { name: 'Back', value: 'back' },
      { name: 'Exit', value: 'exit' }
    );

    const { choice } = await PromptManager.promptWithEsc({
      type: 'list',
      name: 'choice',
      message: 'Theme Management:',
      choices,
      pageSize: MENU_CONFIG.THEMES_PAGE_SIZE
    }, 'back');

    if (choice === 'back') {
      return;
    }
    if (choice === 'exit') {
      MenuNavigator.clearScreen();
      console.log(chalk.green(MESSAGES.EXIT));
      process.exit(0);
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
  const removableThemes = themes.filter(t => t.name !== 'system');
  
  if (removableThemes.length === 0) {
    console.log(chalk.yellow(MESSAGES.NO_CUSTOM_THEMES));
    await PromptManager.pressEnterToContinue();
    MenuNavigator.clearScreen();
    return;
  }

  const { themeToRemove } = await PromptManager.promptWithEsc({
    type: 'list',
    name: 'themeToRemove',
    message: 'Select theme to remove:',
    choices: [
      ...removableThemes.map(t => ({ name: t.name, value: t.name })),
      new inquirer.Separator(),
      { name: 'Back', value: 'back' },
      { name: 'Exit', value: 'exit' }
    ]
  }, 'back');

  if (themeToRemove === 'back') {
    MenuNavigator.clearScreen();
    return;
  }
  if (themeToRemove === 'exit') {
    MenuNavigator.clearScreen();
    console.log(chalk.green(MESSAGES.EXIT));
    process.exit(0);
  }

  const confirmed = await PromptManager.confirmAction(
    `${PROMPTS.CONFIRM_THEME_REMOVE} "${themeToRemove}"?`,
    false
  );

  if (confirmed) {
    await manager.removeTheme(themeToRemove);
    console.log(chalk.green(`Theme "${themeToRemove}" removed successfully.`));
  }
  
  await PromptManager.pressEnterToContinue();
  MenuNavigator.clearScreen();
}

async function settingsMenu(manager) {
  while (true) {
    await showWelcome();
    const config = manager.configManager.getConfig();
    StatusBar.render(config);

    const { setting } = await PromptManager.promptWithEsc({
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
        { name: 'Back', value: 'back' },
        { name: 'Exit', value: 'exit' }
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
      case 'exit':
        MenuNavigator.clearScreen();
        console.log(chalk.green(MESSAGES.EXIT));
        process.exit(0);
    }
  }
}

async function adjustVolumeFlow(manager) {
  // Clear screen to avoid any leftover text
  MenuNavigator.clearScreen();
  
  const volume = await PromptManager.inputVolume(manager.configManager.getConfig().sound_volume);
  
  if (volume === 'cancel') return;

  await manager.setVolume(parseInt(volume));

  // Play test sound
  await manager.testSingleSound('Notification');
}


async function testSounds(manager) {
  const { choice } = await PromptManager.promptWithEsc({
    type: 'list',
    name: 'choice',
    message: 'Test Sounds:',
    choices: [
      { name: 'Test All Sounds', value: 'all' },
      new inquirer.Separator(),
      ...HOOK_NAMES.map(hook => ({ name: hook, value: hook })),
      new inquirer.Separator(),
      { name: 'Back', value: 'back' },
      { name: 'Exit', value: 'exit' }
    ],
    loop: false
  }, 'back');

  if (choice === 'back') {
    MenuNavigator.clearScreen();
    return;
  }
  if (choice === 'exit') {
    MenuNavigator.clearScreen();
    console.log(chalk.green(MESSAGES.EXIT));
    process.exit(0);
  }

  if (choice === 'all') {
    console.log(chalk.blue('Testing all sounds...'));
    for (const hook of HOOK_NAMES) {
      console.log(chalk.gray(`Playing ${hook}...`));
      await manager.testSingleSound(hook);
      await new Promise(resolve => setTimeout(resolve, SOUND_TEST.DELAY_BETWEEN_SOUNDS));
    }
    console.log(chalk.green('All sounds tested!'));
  } else {
    console.log(chalk.blue(`Playing ${choice}...`));
    await manager.testSingleSound(choice);
  }

  await PromptManager.pressEnterToContinue();
}

async function showSystemInfo(manager) {
  const info = await manager.getSystemInfo();
  SystemInfoDisplay.render(info);
  await PromptManager.pressEnterToContinue();
}

async function uninstallFlow(manager) {
  UninstallWarning.render();

  // Confirmation prompt
  const confirmed = await PromptManager.confirmWithInput(
    PROMPTS.CONFIRM_UNINSTALL,
    'N'
  );

  if (!confirmed) {
    console.log(chalk.yellow('\n' + MESSAGES.UNINSTALL_CANCELLED));
    await PromptManager.pressEnterToContinue(PROMPTS.PRESS_ENTER_MENU);
    return;
  }


  // Execute uninstall
  const spinner = LoadingSpinner.create('Uninstalling Claude Gamify...');
  
  try {
    const result = await manager.uninstall();
    
    if (result.success) {
      LoadingSpinner.success(spinner, 'Claude Gamify has been completely uninstalled');
      UninstallWarning.renderResults(result);
    } else {
      LoadingSpinner.warn(spinner, 'Uninstall completed with some errors');
      UninstallWarning.renderResults(result);
    }
  } catch (error) {
    LoadingSpinner.fail(spinner, `Uninstall failed: ${error.message}`);
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
  .description(COMMAND_DESCRIPTIONS.INIT)
  .action(async () => {
    const manager = new ClaudeSound();
    try {
      await manager.init();
      console.log(chalk.green(MESSAGES.INITIALIZATION_SUCCESS));
    } catch (error) {
      console.error(chalk.red(`Initialization failed: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('status')
  .description(COMMAND_DESCRIPTIONS.STATUS)
  .action(async () => {
    const manager = new ClaudeSound();
    try {
      await manager.initialize();
      const config = manager.configManager.getConfig();
      StatusBar.render(config);
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Check for updates command
program
  .command('check-updates')
  .description(COMMAND_DESCRIPTIONS.CHECK_UPDATES)
  .action(async () => {
    const spinner = LoadingSpinner.create('Checking for updates...');
    
    try {
      const updateInfo = await checkForUpdatesAsync();
      spinner.stop();
      console.log(); // Add line break after spinner
      
      if (updateInfo) {
        VersionCheckDisplay.renderUpdateAvailable(updateInfo);
      } else {
        VersionCheckDisplay.renderUpToDate(VERSION);
      }
    } catch (error) {
      LoadingSpinner.fail(spinner, 'Version check failed');
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });


program
  .command('uninstall')
  .description(COMMAND_DESCRIPTIONS.UNINSTALL)
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
      const confirmUninstall = await PromptManager.confirmAction(
        'Are you sure you want to completely uninstall Claude Gamify?',
        false
      );
      
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
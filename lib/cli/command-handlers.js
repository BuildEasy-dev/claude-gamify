/**
 * Command Handlers
 * Handles all CLI command implementations
 */

import chalk from 'chalk';
import { ClaudeSound } from '../claude-sound.js';
import { 
  StatusBar,
  LoadingSpinner,
  UninstallWarning,
  VersionCheckDisplay
} from '../ui/components.js';
import { PromptManager } from '../ui/prompts.js';
import { MESSAGES, PROMPTS } from '../ui/constants.js';

/**
 * CommandHandlers Class
 * Static methods for handling CLI commands
 */
export class CommandHandlers {
  /**
   * Handle initialization command
   */
  static async handleInit() {
    const manager = new ClaudeSound();
    try {
      await manager.init();
      console.log(chalk.green(MESSAGES.INITIALIZATION_SUCCESS));
    } catch (error) {
      console.error(chalk.red(`Initialization failed: ${error.message}`));
      process.exit(1);
    }
  }

  /**
   * Handle status command
   */
  static async handleStatus() {
    const manager = new ClaudeSound();
    try {
      await manager.initialize();
      const config = manager.configManager.getConfig();
      StatusBar.render(config);
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  }

  /**
   * Handle check-updates command
   * @param {Function} checkForUpdatesAsync - Update check function
   * @param {string} VERSION - Current version string
   */
  static async handleCheckUpdates(checkForUpdatesAsync, VERSION) {
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
  }

  /**
   * Handle uninstall command
   * @param {Object} options - Command options (e.g., --yes flag)
   */
  static async handleUninstall(options = {}) {
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
  }

  /**
   * Handle interactive uninstall flow (from main menu)
   * @param {ClaudeSound} manager - Manager instance
   */
  static async handleInteractiveUninstall(manager) {
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

  /**
   * Handle main menu initialization and setup
   * @param {ClaudeSound} manager - Manager instance
   * @returns {Promise<ClaudeSound>} Initialized manager
   */
  static async initializeManager(manager) {
    try {
      await manager.initialize();
      return manager;
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
            return manager;
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
  }
}
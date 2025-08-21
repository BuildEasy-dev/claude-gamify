/**
 * Interactive Mode
 * Handles interactive flows and user initialization process
 */

import updateNotifier from 'update-notifier';
import { ClaudeSound } from '../orchestrator.js';
import { MenuController } from './menus.js';
import { CommandHandlers } from './commands.js';
import { UPDATE_CONFIG } from '../ui/constants.js';

/**
 * InteractiveMode Class
 * Coordinates the main interactive experience
 */
export class InteractiveMode {
  /**
   * Create a new InteractiveMode instance
   * @param {Object} pkg - Package.json information
   */
  constructor(pkg) {
    this.pkg = pkg;
  }

  /**
   * Start the main interactive menu
   */
  async start() {
    const manager = new ClaudeSound();
    
    // Start version check in parallel with initialization
    const updateCheckPromise = this.checkForUpdatesAsync();
    
    // Initialize manager with setup flow if needed
    await CommandHandlers.initializeManager(manager);

    // Get update info once at start
    let updateInfo = null;
    try {
      updateInfo = await updateCheckPromise;
    } catch (error) {
      // Silently ignore upgrade check errors
    }

    // Create menu controller and start main menu loop
    const menuController = new MenuController(manager);
    const action = await menuController.showMainMenu(updateInfo);

    // Handle special actions that exit the menu loop
    if (action === 'uninstall') {
      await CommandHandlers.handleInteractiveUninstall(manager);
    }
  }

  /**
   * Check for package updates asynchronously
   * @returns {Promise<Object|null>} Update information or null
   */
  async checkForUpdatesAsync() {
    const notifier = updateNotifier({
      pkg: this.pkg,
      updateCheckInterval: UPDATE_CONFIG.CHECK_INTERVAL,
      shouldNotifyInNpmScript: UPDATE_CONFIG.SHOULD_NOTIFY_IN_NPM_SCRIPT,
      defer: UPDATE_CONFIG.DEFER
    });
    
    if (notifier.update) {
      const executionContext = this.detectExecutionContext();
      return {
        currentVersion: notifier.update.current,
        latestVersion: notifier.update.latest,
        executionContext: executionContext,
        updateAvailable: true
      };
    }
    
    return null;
  }

  /**
   * Detect execution context (npx, global, local)
   * @returns {string} Execution context
   */
  detectExecutionContext() {
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
}
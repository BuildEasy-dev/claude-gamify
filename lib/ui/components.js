/**
 * UI Components
 * Reusable UI elements for the CLI interface
 */

import chalk from 'chalk';
import boxen from 'boxen';
import figlet from 'figlet';
import ora from 'ora';
import { 
  COLORS, 
  BOX_STYLES, 
  ASCII_CONFIG, 
  STATUS_BAR,
  EXECUTION_HINTS 
} from './constants.js';

/**
 * Welcome Screen Component
 * Displays the main welcome screen with ASCII art and update info
 */
export class WelcomeScreen {
  /**
   * Render the welcome screen
   * @param {Object} updateInfo - Optional update information
   * @param {string} updateInfo.latestVersion - Latest available version
   * @param {string} updateInfo.executionContext - How the tool was executed
   */
  static render(updateInfo = null) {
    console.clear();
    
    // Generate ASCII art
    const asciiArt = figlet.textSync('Claude Gamify', ASCII_CONFIG);
    
    // Build welcome content
    let welcomeContent = chalk.hex(COLORS.ACCENT)(asciiArt) + '\n\n' +
      chalk.bold('Welcome to Claude Gamify!\n\n');
    
    // Add update notice if available
    if (updateInfo) {
      const contextHint = this.getExecutionContextHint(updateInfo.executionContext);
      welcomeContent += chalk.yellow(
        `New version available: ${updateInfo.latestVersion} ${contextHint}\n\n`
      );
    }
    
    welcomeContent += chalk.gray('Use arrow keys to navigate, Enter to select, ESC to go back');
    
    // Display in styled box
    console.log(
      boxen(welcomeContent, BOX_STYLES.WELCOME)
    );
  }
  
  /**
   * Get execution context hint message
   * @private
   */
  static getExecutionContextHint(executionContext) {
    switch (executionContext) {
      case 'npx':
        return EXECUTION_HINTS.NPX;
      case 'global':
        return EXECUTION_HINTS.GLOBAL;
      case 'local':
        return EXECUTION_HINTS.LOCAL;
      default:
        return '';
    }
  }
}

/**
 * Status Bar Component
 * Displays current system status in a formatted bar
 */
export class StatusBar {
  /**
   * Render the status bar
   * @param {Object} config - Current configuration
   * @param {boolean} config.sound_enabled - Whether sound is enabled
   * @param {number} config.sound_volume - Volume level (0-1)
   * @param {string} config.theme - Active theme name
   */
  static render(config) {
    const statusText = config.sound_enabled ? 'ENABLED' : 'DISABLED';
    const volume = (config.sound_volume * 100).toFixed(0) + '%';
    const theme = config.theme;
    
    // Top border
    console.log(
      chalk.cyan(
        STATUS_BAR.CORNER_TOP_LEFT + 
        STATUS_BAR.BORDER_CHAR.repeat(STATUS_BAR.WIDTH + 2) + 
        STATUS_BAR.CORNER_TOP_RIGHT
      )
    );
    
    // Status content
    const statusContent = `Sound: ${chalk.bold(statusText)}  Theme: ${theme}  Volume: ${volume}`;
    const contentWidth = this.stripAnsi(statusContent).length;
    const padding = STATUS_BAR.WIDTH - contentWidth;
    
    console.log(
      chalk.cyan(STATUS_BAR.VERTICAL_CHAR + ' ') +
      statusContent +
      ' '.repeat(Math.max(0, padding)) +
      chalk.cyan(' ' + STATUS_BAR.VERTICAL_CHAR)
    );
    
    // Bottom border
    console.log(
      chalk.cyan(
        STATUS_BAR.CORNER_BOTTOM_LEFT + 
        STATUS_BAR.BORDER_CHAR.repeat(STATUS_BAR.WIDTH + 2) + 
        STATUS_BAR.CORNER_BOTTOM_RIGHT + '\n'
      )
    );
  }
  
  /**
   * Strip ANSI codes from string for length calculation
   * @private
   */
  static stripAnsi(str) {
    return str.replace(/\u001b\[[0-9;]*m/g, '');
  }
}

/**
 * System Info Display Component
 * Shows detailed system information
 */
export class SystemInfoDisplay {
  /**
   * Render system information
   * @param {Object} info - System information object
   */
  static render(info) {
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
  }
}

/**
 * Loading Spinner Component
 * Creates and manages loading spinners
 */
export class LoadingSpinner {
  /**
   * Create a new spinner
   * @param {string} text - Initial spinner text
   * @returns {Object} Ora spinner instance
   */
  static create(text) {
    return ora(text).start();
  }
  
  /**
   * Success spinner
   * @param {Object} spinner - Ora spinner instance
   * @param {string} text - Success message
   */
  static success(spinner, text) {
    spinner.succeed(text);
  }
  
  /**
   * Failure spinner
   * @param {Object} spinner - Ora spinner instance
   * @param {string} text - Failure message
   */
  static fail(spinner, text) {
    spinner.fail(text);
  }
  
  /**
   * Warning spinner
   * @param {Object} spinner - Ora spinner instance
   * @param {string} text - Warning message
   */
  static warn(spinner, text) {
    spinner.warn(text);
  }
}

/**
 * Message Box Component
 * Displays messages in styled boxes
 */
export class MessageBox {
  /**
   * Display an info box
   * @param {string} title - Box title
   * @param {string} content - Box content
   */
  static info(title, content) {
    console.log(
      boxen(
        chalk.cyan(title) + '\n\n' + content,
        BOX_STYLES.BASE
      )
    );
  }
  
  /**
   * Display a warning box
   * @param {string} title - Box title
   * @param {string} content - Box content
   */
  static warning(title, content) {
    console.log(
      boxen(
        chalk.red(title) + '\n\n' + chalk.yellow(content),
        BOX_STYLES.WARNING
      )
    );
  }
  
  /**
   * Display a success box
   * @param {string} title - Box title
   * @param {string} content - Box content
   */
  static success(title, content) {
    console.log(
      boxen(
        chalk.green(title) + '\n\n' + content,
        BOX_STYLES.BASE
      )
    );
  }
  
  /**
   * Display a custom box
   * @param {string} content - Box content
   * @param {Object} style - Box style configuration
   */
  static custom(content, style = BOX_STYLES.BASE) {
    console.log(boxen(content, style));
  }
}

/**
 * Theme List Display Component
 * Formats and displays theme choices
 */
export class ThemeListDisplay {
  /**
   * Format theme choices for display
   * @param {Array} themes - List of theme objects
   * @param {string} currentTheme - Currently active theme
   * @returns {Array} Formatted choices for inquirer
   */
  static formatChoices(themes, currentTheme) {
    return themes.map(theme => ({
      name: `${theme.name === currentTheme ? '✓' : ' '} ${theme.name} ${chalk.gray(`(${theme.description || 'No description'})`)}`,
      value: theme.name,
      short: theme.name
    }));
  }
}

/**
 * Uninstall Warning Display
 * Shows uninstall confirmation with details
 */
export class UninstallWarning {
  /**
   * Display uninstall warning
   */
  static render() {
    console.clear();
    
    const content = 
      chalk.red('⚠️  Uninstall Claude Gamify\n\n') +
      chalk.yellow('This will remove ALL Claude Gamify files and settings:\n') +
      chalk.gray('  • ~/.claude-gamify/ (all sound files & configuration)\n') +
      chalk.gray('  • ~/.claude/output-styles/<theme>.md (theme styles)\n') + 
      chalk.gray('  • Hook configurations from Claude Code settings\n') +
      chalk.gray('  • Reset output style if using gamify theme');
    
    console.log(boxen(content, BOX_STYLES.WARNING));
  }
  
  /**
   * Display uninstall results
   * @param {Object} result - Uninstall result object
   */
  static renderResults(result) {
    if (result.success) {
      console.log(chalk.green('✅ Claude Gamify has been completely uninstalled'));
      console.log(chalk.gray('\nRemoved:'));
      console.log(chalk.gray(`  • ${result.removedHooks} hook configurations`));
      console.log(chalk.gray(`  • ${result.removedStyles.length} output style files`));
      console.log(chalk.gray('  • All local installation files'));
      console.log(chalk.blue('\n👋 Thank you for using Claude Gamify!'));
      console.log(chalk.gray('You can reinstall anytime with: npx claude-gamify'));
    } else {
      console.log(chalk.yellow('⚠️  Uninstall completed with some errors'));
      
      if (result.errors.length > 0) {
        console.log(chalk.yellow('\n⚠️  Some operations failed:'));
        result.errors.forEach(err => {
          console.log(chalk.gray(`  • ${err}`));
        });
      }
    }
  }
}

/**
 * Version Check Display
 * Shows version check results
 */
export class VersionCheckDisplay {
  /**
   * Display update available message
   * @param {Object} updateInfo - Update information
   */
  static renderUpdateAvailable(updateInfo) {
    const contextHint = WelcomeScreen.getExecutionContextHint(updateInfo.executionContext);
    
    console.log(
      boxen(
        `${chalk.yellow('Update Available!')}\n\n` +
        `Current Version: ${chalk.red(updateInfo.currentVersion)}\n` +
        `Latest Version: ${chalk.green(updateInfo.latestVersion)}\n\n` +
        chalk.cyan(`Run: ${contextHint.replace(/[()]/g, '').replace('run: ', '')}`),
        {
          ...BOX_STYLES.BASE,
          title: 'Claude Gamify Version Check',
          titleAlignment: 'center'
        }
      )
    );
  }
  
  /**
   * Display up-to-date message
   * @param {string} version - Current version
   */
  static renderUpToDate(version) {
    console.log(
      boxen(
        `${chalk.green('You are using the latest version!')}\n\n` +
        `Current Version: ${chalk.green(version)}`,
        {
          ...BOX_STYLES.BASE,
          title: 'Claude Gamify Version Check',
          titleAlignment: 'center'
        }
      )
    );
  }
}
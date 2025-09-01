/**
 * Welcome Screen Component
 * Displays the main welcome screen with ASCII art and update info
 */

import chalk from 'chalk';
import boxen from 'boxen';
import figlet from 'figlet';
import { 
  COLORS, 
  BOX_STYLES, 
  ASCII_CONFIG,
  EXECUTION_HINTS
} from '../../constants.js';

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
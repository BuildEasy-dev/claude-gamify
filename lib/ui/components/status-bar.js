/**
 * Status Bar Component
 * Displays current system status in a formatted bar
 */

import chalk from 'chalk';
import { STATUS_BAR } from '../constants/index.js';

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
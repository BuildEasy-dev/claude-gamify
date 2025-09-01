/**
 * Version Check Display
 * Shows version check results
 */

import chalk from 'chalk';
import boxen from 'boxen';
import { BOX_STYLES } from '../../constants.js';

// Import WelcomeScreen for context hint method
import { WelcomeScreen } from '../welcome/index.js';

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
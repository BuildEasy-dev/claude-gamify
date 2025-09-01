/**
 * Message Box Component
 * Displays messages in styled boxes
 */

import chalk from 'chalk';
import boxen from 'boxen';
import { BOX_STYLES } from '../constants.js';

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
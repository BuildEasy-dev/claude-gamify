/**
 * Menu Navigator
 * Standard menu navigation patterns and utilities
 */

import { MENU_CONFIG } from '../constants/index.js';
import { PromptEscHandler } from './esc-handler.js';

/**
 * Menu Navigation Helper
 * Simplifies menu navigation patterns
 */
export class MenuNavigatorCore {
  /**
   * Handle standard menu navigation
   * @param {string} choice - User's menu choice
   * @returns {boolean} True if should continue loop, false to go back
   */
  static handleNavigation(choice) {
    switch (choice) {
      case 'back':
        return false;
      case 'exit':
        PromptEscHandler.handleExit();
        return false;
      case MENU_CONFIG.IGNORE_BACK_VALUE:
        // ESC pressed on main menu - continue
        return true;
      default:
        return true;
    }
  }
  
  /**
   * Clear screen helper
   */
  static clearScreen() {
    console.clear();
  }
}
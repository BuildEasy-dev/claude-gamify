/**
 * Core Prompt Utilities
 * Basic input/output prompt functionality
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { PROMPTS, MENU_CONFIG } from '../constants.js';

/**
 * Core Prompt Manager
 * Handles basic interactive prompts and user input
 */
export class PromptManagerCore {
  /**
   * Confirm an action
   * @param {string} message - Confirmation message
   * @param {boolean} defaultValue - Default answer
   * @returns {Promise<boolean>} User's confirmation
   */
  static async confirmAction(message, defaultValue = false) {
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message,
        default: defaultValue
      }
    ]);
    return confirmed;
  }
  
  /**
   * Prompt for text input
   * @param {string} message - Input prompt message
   * @param {Function} validate - Optional validation function
   * @returns {Promise<string>} User's input
   */
  static async inputText(message, validate = null) {
    const { value } = await inquirer.prompt([
      {
        type: 'input',
        name: 'value',
        message,
        validate
      }
    ]);
    return value;
  }
  
  /**
   * Prompt for volume input
   * @param {number} currentVolume - Current volume (0-1)
   * @returns {Promise<number|string>} New volume or 'cancel'
   */
  static async inputVolume(currentVolume) {
    const { volume } = await inquirer.prompt([
      {
        type: 'input',
        name: 'volume',
        message: `Current volume: ${(currentVolume * 100).toFixed(0)}%. ${PROMPTS.VOLUME_INPUT}`,
        validate: (input) => {
          // Check for invalid characters
          if (input.includes('.') || !/^\d+$/.test(input)) {
            return PROMPTS.VOLUME_VALIDATION_ERROR;
          }
          const num = parseInt(input);
          if (isNaN(num) || num < 0 || num > 100) {
            return PROMPTS.VOLUME_VALIDATION_ERROR;
          }
          return true;
        }
      }
    ]);
    
    return volume;
  }
  
  /**
   * Press Enter to continue prompt
   * @param {string} message - Optional custom message
   */
  static async pressEnterToContinue(message = PROMPTS.PRESS_ENTER) {
    await inquirer.prompt([
      { type: 'input', name: 'continue', message }
    ]);
  }
  
  /**
   * Select from list with pagination
   * @param {string} message - Prompt message
   * @param {Array} choices - List choices
   * @param {number} pageSize - Items per page
   * @returns {Promise<*>} Selected value
   */
  static async selectFromList(message, choices, pageSize = MENU_CONFIG.PAGE_SIZE) {
    const { selection } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selection',
        message,
        choices,
        pageSize,
        loop: false
      }
    ]);
    
    return selection;
  }
  
  /**
   * Prompt for yes/no confirmation with text input
   * @param {string} message - Confirmation message
   * @param {string} defaultValue - Default value
   * @returns {Promise<boolean>} True if confirmed
   */
  static async confirmWithInput(message, defaultValue = 'N') {
    const { confirmation } = await inquirer.prompt([
      {
        type: 'input',
        name: 'confirmation',
        message: chalk.green(message),
        default: defaultValue,
        validate: (input) => {
          const normalized = input.toLowerCase().trim();
          if (['y', 'yes', 'n', 'no', ''].includes(normalized)) {
            return true;
          }
          return 'Please enter y/yes or n/no';
        }
      }
    ]);
    
    return ['y', 'yes'].includes(confirmation.toLowerCase());
  }
}
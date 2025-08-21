/**
 * Prompt Utilities
 * Enhanced prompt functionality with ESC key support
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { MESSAGES, PROMPTS, MENU_CONFIG } from './constants.js';

/**
 * Enhanced Prompt Manager
 * Provides ESC key support and other prompt enhancements
 */
export class PromptManager {
  /**
   * Prompt with ESC key support
   * @param {Object} promptConfig - Inquirer prompt configuration
   * @param {string} backValue - Value to return when ESC is pressed
   * @returns {Promise<Object>} Prompt answer
   */
  static async promptWithEsc(promptConfig, backValue = MENU_CONFIG.DEFAULT_BACK_VALUE) {
    // Add ESC instruction to list choices (but not for ignore case)
    if (promptConfig.type === 'list' && promptConfig.choices && backValue !== MENU_CONFIG.IGNORE_BACK_VALUE) {
      promptConfig = this.addBackOption(promptConfig, backValue);
    }
    
    // Set up ESC key handler
    return new Promise((resolve, reject) => {
      const handleKeypress = (str, key) => {
        if (key && key.name === 'escape') {
          if (backValue !== MENU_CONFIG.IGNORE_BACK_VALUE) {
            console.log('\n' + chalk.gray(MESSAGES.ESC_PRESSED));
          }
          process.stdin.removeListener('keypress', handleKeypress);
          resolve({ [promptConfig.name]: backValue });
          return;
        }
        // Handle Ctrl+C
        if (key && key.ctrl && key.name === 'c') {
          this.handleExit();
        }
      };
      
      process.stdin.on('keypress', handleKeypress);
      
      inquirer.prompt([promptConfig]).then(answer => {
        process.stdin.removeListener('keypress', handleKeypress);
        resolve(answer);
      }).catch(error => {
        process.stdin.removeListener('keypress', handleKeypress);
        // Handle Ctrl+C interrupt error
        if (error.name === 'ExitPromptError' || error.isTtyError) {
          this.handleExit();
        }
        reject(error);
      });
    });
  }
  
  /**
   * Add back option to list choices
   * @private
   */
  static addBackOption(promptConfig, backValue) {
    const config = { ...promptConfig };
    
    // Check if back option already exists
    const hasBackOption = config.choices.some(choice => 
      (typeof choice === 'object' && choice.value === backValue) ||
      (typeof choice === 'string' && choice === backValue)
    );
    
    if (!hasBackOption) {
      // Add separator and back option if not exists
      config.choices = [
        ...config.choices,
        new inquirer.Separator(),
        { name: 'Back (or press ESC)', value: backValue }
      ];
    } else {
      // Update existing back option to mention ESC
      config.choices = config.choices.map(choice => {
        if (typeof choice === 'object' && choice.value === backValue) {
          return { ...choice, name: choice.name.replace('Back', 'Back (or press ESC)') };
        }
        return choice;
      });
    }
    
    return config;
  }
  
  /**
   * Handle clean exit
   * @private
   */
  static handleExit() {
    console.clear();
    console.log(chalk.green('\n' + MESSAGES.EXIT));
    process.exit(0);
  }
  
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
    const result = await this.promptWithEsc({
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
    }, 'cancel');
    
    return result.volume;
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
    const { selection } = await this.promptWithEsc({
      type: 'list',
      name: 'selection',
      message,
      choices,
      pageSize,
      loop: false
    });
    
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
  
  /**
   * Create a menu with standard options
   * @param {string} message - Menu message
   * @param {Array} choices - Menu choices
   * @param {Object} options - Additional options
   * @returns {Promise<*>} Selected value
   */
  static async showMenu(message, choices, options = {}) {
    const {
      includeBack = true,
      includeExit = true,
      pageSize = MENU_CONFIG.PAGE_SIZE,
      backValue = MENU_CONFIG.DEFAULT_BACK_VALUE
    } = options;
    
    const menuChoices = [...choices];
    
    if (includeBack || includeExit) {
      menuChoices.push(new inquirer.Separator());
      if (includeBack) {
        menuChoices.push({ name: 'Back', value: 'back' });
      }
      if (includeExit) {
        menuChoices.push({ name: 'Exit', value: 'exit' });
      }
    }
    
    const result = await this.promptWithEsc({
      type: 'list',
      name: 'choice',
      message,
      choices: menuChoices,
      pageSize,
      loop: false
    }, backValue);
    
    // Handle exit choice
    if (result.choice === 'exit') {
      this.handleExit();
    }
    
    return result.choice;
  }
}

/**
 * Menu Navigation Helper
 * Simplifies menu navigation patterns
 */
export class MenuNavigator {
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
        PromptManager.handleExit();
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
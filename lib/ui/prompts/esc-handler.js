/**
 * ESC Key Handler
 * Enhanced prompt functionality with ESC key support
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import keypress from 'keypress';
import { MESSAGES, MENU_CONFIG } from '../constants/index.js';

/**
 * ESC Key Enhanced Prompt Handler
 * Provides ESC key support for all interactive prompts
 */
export class PromptEscHandler {
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
            console.log('\\n' + chalk.gray(MESSAGES.ESC_PRESSED));
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
    console.log(chalk.green('\\n' + MESSAGES.EXIT));
    process.exit(0);
  }
  
  /**
   * Create a menu with standard options and ESC support
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
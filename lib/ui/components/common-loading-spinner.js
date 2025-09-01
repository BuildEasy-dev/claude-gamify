/**
 * Loading Spinner Component
 * Creates and manages loading spinners
 */

import ora from 'ora';

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
/**
 * Messages and User Text Configuration
 * Contains all user-facing text messages and prompts
 */

// Messages
export const MESSAGES = {
  EXIT: '👋 Thanks for using Claude Gamify!',
  ESC_PRESSED: '(ESC pressed - going back)',
  SETUP_COMPLETE: 'Setup Complete!',
  INITIALIZATION_SUCCESS: 'Claude Gamify initialized successfully!',
  SOUND_DISABLED: 'Sound is disabled. Enable sound to test.',
  NO_CUSTOM_THEMES: 'No custom themes available to remove.',
  UNINSTALL_CANCELLED: '✨ Uninstall cancelled',
  UNINSTALL_SUCCESS: '👋 Thank you for using Claude Gamify!',
  REINSTALL_TIP: 'You can reinstall anytime with: npx claude-gamify'
};

// Prompt Messages
export const PROMPTS = {
  PRESS_ENTER: 'Press Enter to continue...',
  PRESS_ENTER_MENU: 'Press Enter to return to menu...',
  CONFIRM_UNINSTALL: 'Are you sure you want to completely uninstall Claude Gamify? (y/N)',
  CONFIRM_THEME_REMOVE: 'Are you sure you want to remove theme',
  NO_CONFIG_FOUND: 'No configuration found. Would you like to initialize Claude Gamify?',
  VOLUME_INPUT: 'Enter new volume (0-100):',
  VOLUME_VALIDATION_ERROR: 'Please enter a whole number between 0 and 100'
};

// CLI Command Descriptions
export const COMMAND_DESCRIPTIONS = {
  INIT: 'Initialize Claude Gamify system',
  STATUS: 'Show current status',
  CHECK_UPDATES: 'Check for available NPM package updates',
  UNINSTALL: 'Completely uninstall Claude Gamify'
};

// Execution Context Hints
export const EXECUTION_HINTS = {
  NPX: '(run: npx claude-gamify@latest)',
  GLOBAL: '(run: npm i -g claude-gamify@latest)',
  LOCAL: '(run: npm i claude-gamify@latest)'
};
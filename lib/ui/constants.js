/**
 * UI Constants and Styles
 * Centralized configuration for all UI elements
 */

// Color Scheme
export const COLORS = {
  BORDER: '#cc785c',
  ACCENT: '#cc785c',
  SUCCESS: 'green',
  WARNING: 'yellow',
  ERROR: 'red',
  INFO: 'cyan',
  MUTED: 'gray'
};

// Box Configurations
export const BOX_STYLES = {
  // Standard box for general UI elements
  BASE: {
    borderStyle: 'single',
    borderColor: COLORS.BORDER,
    padding: 1,
    margin: 1
  },
  
  // Warning box for destructive actions
  WARNING: {
    borderStyle: 'single',
    borderColor: 'red',
    padding: 1,
    margin: 0
  },
  
  // Compact box for inline messages
  COMPACT: {
    borderStyle: 'single',
    borderColor: COLORS.BORDER,
    padding: 1,
    margin: 0
  },
  
  // Welcome screen box
  WELCOME: {
    borderStyle: 'single',
    borderColor: COLORS.BORDER,
    padding: 1,
    margin: 0,
    textAlignment: 'center'
  }
};

// ASCII Art Configuration
export const ASCII_CONFIG = {
  FONT: 'Small',
  HORIZONTAL_LAYOUT: 'default',
  VERTICAL_LAYOUT: 'default',
  WIDTH: 60,
  WHITESPACE_BREAK: true
};

// Status Bar Configuration
export const STATUS_BAR = {
  WIDTH: 65,
  BORDER_CHAR: '─',
  CORNER_TOP_LEFT: '┌',
  CORNER_TOP_RIGHT: '┐',
  CORNER_BOTTOM_LEFT: '└',
  CORNER_BOTTOM_RIGHT: '┘',
  VERTICAL_CHAR: '│'
};

// Menu Configuration
export const MENU_CONFIG = {
  PAGE_SIZE: 10,
  THEMES_PAGE_SIZE: 12,
  DEFAULT_BACK_VALUE: 'back',
  IGNORE_BACK_VALUE: 'ignore'
};

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

// Update Check Configuration
export const UPDATE_CONFIG = {
  CHECK_INTERVAL: 1000 * 60 * 15, // 15 minutes
  SHOULD_NOTIFY_IN_NPM_SCRIPT: false,
  DEFER: false
};

// Execution Context Hints
export const EXECUTION_HINTS = {
  NPX: '(run: npx claude-gamify@latest)',
  GLOBAL: '(run: npm i -g claude-gamify@latest)',
  LOCAL: '(run: npm i claude-gamify@latest)'
};

// Sound Test Configuration
export const SOUND_TEST = {
  DELAY_BETWEEN_SOUNDS: 1500,
  PLAYBACK_WAIT: 100
};

// CLI Command Descriptions
export const COMMAND_DESCRIPTIONS = {
  INIT: 'Initialize Claude Gamify system',
  STATUS: 'Show current status',
  CHECK_UPDATES: 'Check for available NPM package updates',
  UNINSTALL: 'Completely uninstall Claude Gamify'
};

// Hook Names (for sound testing)
export const HOOK_NAMES = [
  'SessionStart',
  'UserPromptSubmit',
  'PreToolUse',
  'PostToolUse',
  'Notification',
  'Stop',
  'SubagentStop'
];
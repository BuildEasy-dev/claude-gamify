/**
 * Application Configuration Constants
 * Contains all application settings and configuration values
 */

// Menu Configuration
export const MENU_CONFIG = {
  PAGE_SIZE: 10,
  THEMES_PAGE_SIZE: 12,
  DEFAULT_BACK_VALUE: 'back',
  IGNORE_BACK_VALUE: 'ignore'
};

// Update Check Configuration
export const UPDATE_CONFIG = {
  CHECK_INTERVAL: 1000 * 60 * 15, // 15 minutes
  SHOULD_NOTIFY_IN_NPM_SCRIPT: false,
  DEFER: false
};

// Sound Test Configuration
export const SOUND_TEST = {
  DELAY_BETWEEN_SOUNDS: 1500,
  PLAYBACK_WAIT: 100
};
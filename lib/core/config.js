/**
 * Configuration Manager
 * Handles all configuration file operations
 */

import fs from 'fs/promises';
import { FileUtils, ConfigDefaults, ConfigUtils, SystemUtils } from '../utils.js';

// Hook event name mapping
const HOOK_EVENT_MAPPING = ConfigDefaults.hookEventMapping;
const CONFIG_TO_EVENT = ConfigDefaults.configToEvent;
const DEFAULT_HOOK_CONFIGS = ConfigDefaults.defaultHookConfigs;

/**
 * ConfigManager Class
 * Manages configuration loading, saving, and validation
 */
export class ConfigManager {
  /**
   * Create a new ConfigManager instance
   * @param {string} configPath - Path to configuration file
   */
  constructor(configPath) {
    this.configPath = configPath;
    this.config = null;
  }

  /**
   * Load configuration from file
   * @throws {Error} If configuration file not found
   */
  async load() {
    try {
      const configContent = await fs.readFile(this.configPath, 'utf8');
      this.config = ConfigUtils.mergeWithDefaults(JSON.parse(configContent));
      return this.config;
    } catch (error) {
      throw new Error('Configuration file not found. Run initialization first.');
    }
  }

  /**
   * Save current configuration to file
   */
  async save() {
    if (!this.config) {
      throw new Error('No configuration loaded');
    }
    await FileUtils.writeJsonFile(this.configPath, this.config);
  }

  /**
   * Update configuration with changes
   * @param {Object} changes - Configuration changes to apply
   */
  async update(changes) {
    if (!this.config) {
      await this.load();
    }
    
    // Validate and apply changes
    const validatedChanges = ConfigUtils.validateConfig(changes);
    this.config = { ...this.config, ...validatedChanges };
    await this.save();
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }
    return { ...this.config };
  }

  /**
   * Set a specific configuration value
   * @param {string} key - Configuration key
   * @param {*} value - Configuration value
   */
  async set(key, value) {
    if (!this.config) {
      await this.load();
    }
    
    if (!ConfigDefaults.validKeys.includes(key)) {
      throw new Error(`Invalid configuration key: ${key}`);
    }
    
    this.config[key] = value;
    await this.save();
  }

  /**
   * Get a specific configuration value
   * @param {string} key - Configuration key
   * @returns {*} Configuration value
   */
  get(key) {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }
    return this.config[key];
  }

  /**
   * Check if configuration exists
   * @returns {Promise<boolean>} True if config file exists
   */
  async exists() {
    try {
      await fs.access(this.configPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initialize with default configuration
   */
  async initialize() {
    // initialize with defaults and current package version
    this.config = { ...ConfigDefaults.defaultConfig, version: SystemUtils.getSystemInfo().version };
    await this.save();
  }

  /**
   * Reset to default configuration
   */
  async reset() {
    await this.initialize();
  }

  /**
   * Export configuration for backup
   * @returns {Object} Configuration object
   */
  export() {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }
    return { ...this.config };
  }

  /**
   * Import configuration from object
   * @param {Object} importConfig - Configuration to import
   */
  async import(importConfig) {
    const validatedConfig = ConfigUtils.validateConfig(importConfig);
    this.config = ConfigUtils.mergeWithDefaults(validatedConfig);
    await this.save();
  }

  /**
   * Toggle sound enabled state
   */
  async toggleSound() {
    if (!this.config) {
      await this.load();
    }
    this.config.sound_enabled = !this.config.sound_enabled;
    await this.save();
    return this.config.sound_enabled;
  }

  /**
   * Set volume level
   * @param {number} volume - Volume level (0-100 integer)
   */
  async setVolume(volume) {
    if (!this.config) {
      await this.load();
    }
    this.config.sound_volume = ConfigUtils.validateVolume(volume);
    await this.save();
    return this.config.sound_volume;
  }

  /**
   * Set active theme
   * @param {string} themeName - Name of theme to activate
   */
  async setTheme(themeName) {
    if (!this.config) {
      await this.load();
    }
    this.config.theme = themeName;
    await this.save();
    return this.config.theme;
  }

  /**
   * Get theme name
   * @returns {string} Current theme name
   */
  getTheme() {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }
    return this.config.theme;
  }

  /**
   * Check if sound is enabled
   * @returns {boolean} True if sound is enabled
   */
  isSoundEnabled() {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }
    return this.config.sound_enabled;
  }

  /**
   * Get volume level
   * @returns {number} Volume level (0-1)
   */
  getVolume() {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }
    return this.config.sound_volume;
  }

  /**
   * Convert between Claude event names and config keys
   * @param {string} eventName - Claude event name (PascalCase)
   * @returns {string} Config key (snake_case)
   */
  eventToConfigKey(eventName) {
    return HOOK_EVENT_MAPPING[eventName] || 
           eventName.replace(/([A-Z])/g, '_$1').toLowerCase().substring(1);
  }

  /**
   * Convert config key to event name
   * @param {string} configKey - Config key (snake_case)
   * @returns {string} Claude event name (PascalCase)
   */
  configKeyToEvent(configKey) {
    return CONFIG_TO_EVENT[configKey] || configKey;
  }

  /**
   * Get hook state for a specific event
   * @param {string} eventName - Claude event name
   * @returns {Promise<boolean>} Hook enabled state
   */
  async getHookState(eventName) {
    if (!this.config) {
      await this.load();
    }
    const configKey = this.eventToConfigKey(eventName);
    
    if (this.config.sound_hooks && configKey in this.config.sound_hooks) {
      return this.config.sound_hooks[configKey];
    }
    return true; // Default to enabled
  }

  /**
   * Set hook state for a specific event
   * @param {string} eventName - Claude event name
   * @param {boolean} enabled - Enable/disable state
   */
  async setHookState(eventName, enabled) {
    if (!this.config) {
      await this.load();
    }
    const configKey = this.eventToConfigKey(eventName);
    
    if (!this.config.sound_hooks) {
      this.config.sound_hooks = {};
    }
    this.config.sound_hooks[configKey] = enabled;
    await this.save();
  }

  /**
   * Set all hook states
   * @param {boolean} enabled - Enable/disable all hooks
   */
  async setAllHookStates(enabled) {
    if (!this.config) {
      await this.load();
    }
    
    if (!this.config.sound_hooks) {
      this.config.sound_hooks = {};
    }
    
    DEFAULT_HOOK_CONFIGS.forEach(hookConfig => {
      this.config.sound_hooks[hookConfig] = enabled;
    });
    await this.save();
  }

  /**
   * Invert all hook states
   */
  async invertHookStates() {
    if (!this.config) {
      await this.load();
    }
    
    if (!this.config.sound_hooks) {
      this.config.sound_hooks = {};
    }
    
    DEFAULT_HOOK_CONFIGS.forEach(hookConfig => {
      const current = this.config.sound_hooks[hookConfig] !== false;
      this.config.sound_hooks[hookConfig] = !current;
    });
    await this.save();
  }

  /**
   * Get count of active hooks
   * @returns {Promise<number>} Number of enabled hooks
   */
  async getActiveHooksCount() {
    if (!this.config) {
      await this.load();
    }
    
    if (!this.config.sound_hooks) {
      return DEFAULT_HOOK_CONFIGS.length; // All enabled by default
    }
    
    return DEFAULT_HOOK_CONFIGS.filter(hookConfig => 
      this.config.sound_hooks[hookConfig] !== false
    ).length;
  }

  /**
   * Reset hook states to defaults
   */
  async resetHookStates() {
    if (!this.config) {
      await this.load();
    }
    
    this.config.sound_hooks = ConfigDefaults.defaultHookStates;
    await this.save();
  }

  /**
   * Get all hook states
   * @returns {Promise<Object>} Map of hook config keys to enabled state
   */
  async getAllHookStates() {
    if (!this.config) {
      await this.load();
    }
    
    if (!this.config.sound_hooks) {
      return ConfigDefaults.defaultHookStates;
    }
    
    const states = {};
    DEFAULT_HOOK_CONFIGS.forEach(hookConfig => {
      states[hookConfig] = this.config.sound_hooks[hookConfig] !== false;
    });
    return states;
  }
}

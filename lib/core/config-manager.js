/**
 * Configuration Manager
 * Handles all configuration file operations
 */

import fs from 'fs/promises';
import { FileUtils, ConfigDefaults, ConfigUtils } from '../utils.js';

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
    this.config = ConfigDefaults.defaultConfig;
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
}
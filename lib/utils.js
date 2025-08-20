/**
 * Utility functions and constants for Claude Gamify
 * Common functionality extracted from the main manager
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

/**
 * Path constants and utilities
 */
class Paths {
  static get homeDir() {
    return os.homedir();
  }

  static get claudeGamifyDir() {
    return path.join(this.homeDir, '.claude-gamify');
  }

  static get configFile() {
    return path.join(this.claudeGamifyDir, 'config.json');
  }

  static get themesDir() {
    return path.join(this.claudeGamifyDir, 'themes');
  }

  static get playerPath() {
    return path.join(this.claudeGamifyDir, 'play_sound.js');
  }

  static get indexPath() {
    return path.join(this.claudeGamifyDir, 'index.js');
  }

  static get claudeConfigPath() {
    return path.join(this.homeDir, '.claude', 'settings.json');
  }

  static get claudeOutputStylesDir() {
    return path.join(this.homeDir, '.claude', 'output-styles');
  }

  static get templateDir() {
    return path.join(__dirname, '..', 'template');
  }
}

/**
 * Configuration defaults and validation
 */
class ConfigDefaults {
  static get defaultConfig() {
    return {
      theme: 'zelda',
      sound_enabled: true,
      sound_volume: 0.5
    };
  }

  static get validKeys() {
    return ['theme', 'sound_enabled', 'sound_volume'];
  }

  static get hookCommands() {
    return [
      'SessionStart',
      'UserPromptSubmit', 
      'PreToolUse',
      'PostToolUse',
      'Notification',
      'Stop',
      'SubagentStop'
    ];
  }
}

/**
 * File system utilities
 */
class FileUtils {
  /**
   * Recursively copy directory
   */
  static async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Safe JSON file reading with fallback
   */
  static async readJsonFile(filePath, fallback = {}) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch {
      return fallback;
    }
  }

  /**
   * Write JSON file with formatting
   */
  static async writeJsonFile(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }
}

/**
 * System utilities
 */
class SystemUtils {
  /**
   * Get available audio players on current platform
   */
  static getAvailableAudioPlayers() {
    const players = [];
    
    if (process.platform === 'darwin') {
      players.push('afplay');
    } else if (process.platform === 'linux') {
      const linuxPlayers = ['paplay', 'aplay', 'mpg123', 'play'];
      
      for (const player of linuxPlayers) {
        try {
          execSync(`which ${player}`, { stdio: 'ignore' });
          players.push(player);
        } catch {
          // Player not available
        }
      }
    }
    
    return players;
  }

  /**
   * Get system information
   */
  static getSystemInfo() {
    const audioPlayers = this.getAvailableAudioPlayers();
    
    return {
      platform: process.platform,
      nodeVersion: process.version,
      version: require('../package.json').version,
      audioPlayers
    };
  }
}

/**
 * Configuration validation utilities
 */
class ConfigUtils {
  /**
   * Validate and filter configuration object
   */
  static validateConfig(newConfig) {
    const validKeys = ConfigDefaults.validKeys;
    const filteredConfig = {};
    
    for (const key of validKeys) {
      if (newConfig.hasOwnProperty(key)) {
        filteredConfig[key] = newConfig[key];
      }
    }
    
    return filteredConfig;
  }

  /**
   * Merge configuration with defaults
   */
  static mergeWithDefaults(config) {
    return { ...ConfigDefaults.defaultConfig, ...config };
  }

  /**
   * Validate volume range (0-100 integer input)
   */
  static validateVolume(volume) {
    // Convert to number if string
    const numVolume = typeof volume === 'string' ? parseInt(volume, 10) : volume;
    
    // Check if it's a valid integer between 0-100
    if (!Number.isInteger(numVolume) || numVolume < 0 || numVolume > 100) {
      throw new Error('Volume must be an integer between 0 and 100');
    }
    
    // Convert to 0.0-1.0 float for storage
    return numVolume / 100;
  }
}

module.exports = {
  Paths,
  ConfigDefaults,
  FileUtils,
  SystemUtils,
  ConfigUtils
};
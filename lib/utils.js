/**
 * Utility functions and constants for Claude Gamify
 * Common functionality extracted from the main manager
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

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
      sound_volume: 0.5,
      sound_hooks: this.defaultHookStates
    };
  }

  static get validKeys() {
    return ['theme', 'sound_enabled', 'sound_volume', 'sound_hooks', 'version'];
  }

  static get hookEventMapping() {
    return {
      'SessionStart': 'session_start',
      'UserPromptSubmit': 'user_prompt_submit',
      'PreToolUse': 'pre_tool_use',
      'PostToolUse': 'post_tool_use',
      'Notification': 'notification',
      'Stop': 'stop',
      'SubagentStop': 'subagent_stop'
    };
  }

  static get configToEvent() {
    const mapping = {};
    Object.entries(this.hookEventMapping).forEach(([event, config]) => {
      mapping[config] = event;
    });
    return mapping;
  }

  static get defaultHookConfigs() {
    return Object.values(this.hookEventMapping);
  }

  static get defaultHookStates() {
    const states = {};
    this.defaultHookConfigs.forEach(hookConfig => {
      states[hookConfig] = true;
    });
    return states;
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
    const migratedConfig = this.migrateConfig(config);
    return { ...ConfigDefaults.defaultConfig, ...migratedConfig };
  }

  /**
   * Migrate configuration to latest format
   */
  static migrateConfig(config) {
    const migrated = { ...config };
    
    // Migrate old field names
    if ('enabled' in migrated && !('sound_enabled' in migrated)) {
      migrated.sound_enabled = migrated.enabled;
      delete migrated.enabled;
    }
    if ('volume' in migrated && !('sound_volume' in migrated)) {
      migrated.sound_volume = migrated.volume;
      delete migrated.volume;
    }
    
    // Add sound_hooks if missing
    if (!migrated.sound_hooks) {
      migrated.sound_hooks = ConfigDefaults.defaultHookStates;
    } else {
      // Ensure all default hooks exist
      ConfigDefaults.defaultHookConfigs.forEach(hookConfig => {
        if (!(hookConfig in migrated.sound_hooks)) {
          migrated.sound_hooks[hookConfig] = true;
        }
      });
    }
    
    return migrated;
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

export {
  Paths,
  ConfigDefaults,
  FileUtils,
  SystemUtils,
  ConfigUtils
};

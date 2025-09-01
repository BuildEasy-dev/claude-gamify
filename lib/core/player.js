/**
 * Sound Player
 * Handles sound playback and testing
 */

import { spawn } from 'child_process';
import chalk from 'chalk';

/**
 * SoundPlayer Class
 * Manages sound playback functionality
 */
export class SoundPlayer {
  /**
   * Create a new SoundPlayer instance
   * @param {ConfigManager} configManager - Configuration manager instance
   * @param {ThemeManager} themeManager - Theme manager instance
   * @param {string} playerPath - Path to the sound player script
   */
  constructor(configManager, themeManager, playerPath) {
    this.configManager = configManager;
    this.themeManager = themeManager;
    this.playerPath = playerPath;
  }

  /**
   * Test a single sound
   * @param {string} hookName - Name of the hook/sound to test
   */
  async testSingle(hookName) {
    if (!this.configManager.isSoundEnabled()) {
      console.log(chalk.yellow('Sound is disabled. Enable sound to test.'));
      return;
    }

    try {
      const player = spawn('node', [this.playerPath, hookName], {
        detached: true,
        stdio: 'ignore'
      });
      player.unref();
      
      // Wait a bit for sound to start
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(chalk.red(`Failed to play sound: ${error.message}`));
    }
  }

  /**
   * Test a single sound (forced - bypasses enabled check for testing)
   * @param {string} hookName - Name of the hook/sound to test
   */
  async testSingleForced(hookName) {
    try {
      const player = spawn('node', [this.playerPath, hookName], {
        detached: true,
        stdio: 'ignore'
      });
      player.unref();
      
      // Wait a bit for sound to start
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(chalk.red(`Failed to play sound: ${error.message}`));
    }
  }

  /**
   * Test all sounds in sequence
   * @param {Array} hookNames - Array of hook names to test
   * @param {number} delayBetween - Delay between sounds in milliseconds
   */
  async testAll(hookNames, delayBetween = 1500) {
    if (!this.configManager.isSoundEnabled()) {
      console.log(chalk.yellow('Sound is disabled. Enable sound to test.'));
      return;
    }

    console.log(chalk.blue('Testing all sounds...'));
    
    for (const hookName of hookNames) {
      console.log(chalk.gray(`Playing ${hookName}...`));
      await this.testSingle(hookName);
      await new Promise(resolve => setTimeout(resolve, delayBetween));
    }
    
    console.log(chalk.green('All sounds tested!'));
  }

  /**
   * Check if sound should play for a specific hook
   * @param {string} hookName - Name of the hook
   * @returns {Promise<boolean>} True if sound should play
   */
  async shouldPlaySound(hookName) {
    // Check global enabled state
    if (!this.configManager.isSoundEnabled()) return false;
    
    // Check volume
    if (this.configManager.getVolume() <= 0) return false;
    
    // Check individual hook state
    return await this.configManager.getHookState(hookName);
  }

  /**
   * Play a sound for a specific hook
   * @param {string} hookName - Name of the hook
   */
  async play(hookName) {
    // Check if sound should play for this hook
    if (!(await this.shouldPlaySound(hookName))) {
      return;
    }

    try {
      const player = spawn('node', [this.playerPath, hookName], {
        detached: true,
        stdio: 'ignore'
      });
      player.unref();
    } catch (error) {
      // Silently fail for production use
    }
  }

  /**
   * Check if sound is available for a hook
   * @param {string} hookName - Name of the hook
   * @returns {Promise<boolean>} True if sound file exists
   */
  async isSoundAvailable(hookName) {
    try {
      const currentTheme = this.configManager.getTheme();
      const soundPath = await this.themeManager.getSoundPath(currentTheme, hookName);
      return soundPath !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get sound file path for current theme
   * @param {string} hookName - Name of the hook
   * @returns {Promise<string|null>} Path to sound file or null
   */
  async getSoundPath(hookName) {
    try {
      const currentTheme = this.configManager.getTheme();
      return await this.themeManager.getSoundPath(currentTheme, hookName);
    } catch {
      return null;
    }
  }

  /**
   * List available sounds for current theme
   * @returns {Promise<Array>} Array of available sound names
   */
  async getAvailableSounds() {
    try {
      const currentTheme = this.configManager.getTheme();
      const themes = await this.themeManager.list();
      const themeInfo = themes.find(t => t.name === currentTheme);
      
      return themeInfo ? themeInfo.soundFiles : [];
    } catch {
      return [];
    }
  }

  /**
   * Test sound system functionality
   * @returns {Promise<Object>} Test results
   */
  async testSystem() {
    const results = {
      soundEnabled: this.configManager.isSoundEnabled(),
      volume: this.configManager.getVolume(),
      currentTheme: this.configManager.getTheme(),
      availableSounds: [],
      playerExists: false,
      testPassed: false
    };

    try {
      // Check if player script exists
      const fs = await import('fs/promises');
      await fs.access(this.playerPath);
      results.playerExists = true;

      // Get available sounds
      results.availableSounds = await this.getAvailableSounds();

      // Test playing a simple sound
      if (results.soundEnabled && results.availableSounds.length > 0) {
        await this.testSingle('Notification');
        results.testPassed = true;
      }
    } catch (error) {
      results.error = error.message;
    }

    return results;
  }

  /**
   * Play notification sound
   */
  async playNotification() {
    await this.play('Notification');
  }

  /**
   * Play session start sound
   */
  async playSessionStart() {
    await this.play('SessionStart');
  }

  /**
   * Play tool use sounds
   */
  async playPreToolUse() {
    await this.play('PreToolUse');
  }

  async playPostToolUse() {
    await this.play('PostToolUse');
  }

  /**
   * Play user prompt submit sound
   */
  async playUserPromptSubmit() {
    await this.play('UserPromptSubmit');
  }

  /**
   * Play stop sound
   */
  async playStop() {
    await this.play('Stop');
  }

  /**
   * Play subagent stop sound
   */
  async playSubagentStop() {
    await this.play('SubagentStop');
  }

  /**
   * Test sound with volume adjustment
   * @param {string} hookName - Name of the hook to test
   * @param {number} volume - Volume level (0-100)
   */
  async testWithVolume(hookName, volume) {
    // Save current volume
    const currentVolume = this.configManager.getVolume();
    
    try {
      // Set test volume
      await this.configManager.setVolume(volume);
      
      // Play test sound
      await this.testSingle(hookName);
    } finally {
      // Restore original volume
      await this.configManager.setVolume(Math.round(currentVolume * 100));
    }
  }

  /**
   * Check sound system health
   * @returns {Promise<Object>} Health check results
   */
  async healthCheck() {
    const health = {
      healthy: true,
      issues: [],
      warnings: []
    };

    try {
      // Check if player exists
      const fs = await import('fs/promises');
      await fs.access(this.playerPath);
    } catch {
      health.healthy = false;
      health.issues.push('Sound player script not found');
    }

    // Check if sounds are available
    const availableSounds = await this.getAvailableSounds();
    if (availableSounds.length === 0) {
      health.warnings.push('No sound files found for current theme');
    }

    // Check configuration
    if (!this.configManager.isSoundEnabled()) {
      health.warnings.push('Sound is currently disabled');
    }

    const volume = this.configManager.getVolume();
    if (volume === 0) {
      health.warnings.push('Volume is set to 0%');
    }

    return health;
  }
}
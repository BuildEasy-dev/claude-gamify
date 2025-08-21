/**
 * Claude Sound Manager - Main coordinator
 * Orchestrates specialized managers for modular functionality
 */

import fs from 'fs/promises';
import path from 'path';
import ora from 'ora';
import { Paths, SystemUtils, FileUtils } from './utils.js';
import { ConfigManager } from './core/config-manager.js';
import { ThemeManager } from './core/theme-manager.js';
import { HookManager } from './core/hook-manager.js';
import { StyleManager } from './core/style-manager.js';
import { SoundPlayer } from './core/sound-player.js';

class ClaudeSound {
  constructor() {
    this.configManager = new ConfigManager(Paths.configFile);
    this.themeManager = new ThemeManager(Paths.themesDir, this.configManager);
    this.hookManager = new HookManager(Paths.claudeConfigPath, Paths.indexPath);
    this.styleManager = new StyleManager(Paths.claudeConfigPath, Paths.claudeOutputStylesDir);
    this.soundPlayer = new SoundPlayer(this.configManager, this.themeManager, Paths.indexPath);
  }

  /**
   * Initialize the manager - load config or throw if not initialized
   */
  async initialize() {
    try {
      await this.configManager.load();
    } catch (error) {
      throw new Error('NOT_INITIALIZED');
    }
  }

  /**
   * One-click initialization - deploy complete system
   */
  async init() {
    const spinner = ora('Initializing Claude Gamify...').start();

    try {
      // Create directory structure
      spinner.text = 'Creating directories...';
      await this.createDirectoryStructure();

      // Deploy player and core files
      spinner.text = 'Installing sound player...';
      await this.deploySystemFiles();

      // Set up Claude Code hooks
      spinner.text = 'Configuring Claude Code hooks...';
      await this.hookManager.setup();

      // Set up output styles
      spinner.text = 'Installing output styles...';
      const templateThemesDir = path.join(Paths.templateDir, 'themes');
      await this.styleManager.setupFromThemes(templateThemesDir);

      // Initialize default configuration
      spinner.text = 'Setting up configuration...';
      await this.configManager.initialize();

      spinner.succeed('Claude Gamify initialized successfully!');
    } catch (error) {
      spinner.fail(`Initialization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create directory structure
   */
  async createDirectoryStructure() {
    const path = await import('path');
    
    await fs.mkdir(Paths.claudeGamifyDir, { recursive: true });
    await fs.mkdir(Paths.themesDir, { recursive: true });
    await fs.mkdir(path.dirname(Paths.claudeConfigPath), { recursive: true });
    await fs.mkdir(Paths.claudeOutputStylesDir, { recursive: true });
  }

  /**
   * Deploy system files from template
   */
  async deploySystemFiles() {
    const { FileUtils } = await import('./utils.js');
    
    // Copy all files from template directory
    const templateFiles = await fs.readdir(Paths.templateDir, { withFileTypes: true });
    
    for (const file of templateFiles) {
      const srcPath = path.join(Paths.templateDir, file.name);
      const destPath = path.join(Paths.claudeGamifyDir, file.name);
      
      if (file.isDirectory()) {
        // Recursively copy directory
        await FileUtils.copyDirectory(srcPath, destPath);
      } else {
        // Copy file
        await fs.copyFile(srcPath, destPath);
      }
    }

    // Make play_sound.js executable
    await fs.chmod(Paths.playerPath, 0o755);
  }





  /**
   * List available themes
   */
  async listThemes() {
    return await this.themeManager.list();
  }


  /**
   * Set current theme
   */
  async setTheme(themeName) {
    await this.themeManager.setActive(themeName);
    await this.styleManager.setActiveStyle(themeName);
  }

  /**
   * Remove a theme
   */
  async removeTheme(themeName) {
    await this.themeManager.remove(themeName);
  }

  /**
   * Toggle sound on/off
   */
  async toggleSound() {
    return await this.configManager.toggleSound();
  }

  /**
   * Set volume (accepts 0-100 integer, stores as 0.0-1.0 float)
   */
  async setVolume(volume) {
    return await this.configManager.setVolume(volume);
  }

  /**
   * Test a single sound
   */
  async testSingleSound(hookName) {
    await this.soundPlayer.testSingle(hookName);
  }

  /**
   * Show quick status display
   */
  async showQuickStatus() {
    const chalk = (await import('chalk')).default;
    
    // Ensure config is loaded
    if (!await this.configManager.exists()) {
      throw new Error('NOT_INITIALIZED');
    }
    
    try {
      await this.configManager.load();
      const config = this.configManager.getConfig();
      
      const statusText = config.sound_enabled ? 'ENABLED' : 'DISABLED';
      const volume = (config.sound_volume * 100).toFixed(0) + '%';
      const theme = config.theme;
    
    console.log(
      chalk.cyan('┌─────────────────────────────────────────────────────────────────┐')
    );
    const statusContent = `Sound: ${chalk.bold(statusText)}  Theme: ${theme}  Volume: ${volume}`;
    const contentWidth = statusContent.replace(/\u001b\[[0-9;]*m/g, '').length; // Remove ANSI codes for length calculation
    const totalWidth = 65; // Width between the borders to match welcome area
    const padding = totalWidth - contentWidth - 2; // 2 for the spaces after │ and before │
    
    console.log(
      chalk.cyan('│ ') +
      statusContent +
      ' '.repeat(Math.max(0, padding)) +
      chalk.cyan(' │')
    );
    console.log(
      chalk.cyan('└─────────────────────────────────────────────────────────────────┘\n')
    );
    } catch (error) {
      console.error('Error loading configuration:', error.message);
      throw error;
    }
  }

  /**
   * Export configuration
   */
  async exportConfig() {
    return this.configManager.export();
  }

  /**
   * Import configuration
   */
  async importConfig(newConfig) {
    await this.configManager.import(newConfig);
  }

  /**
   * Get system information
   */
  async getSystemInfo() {
    const systemInfo = SystemUtils.getSystemInfo();
    const config = this.configManager.getConfig();
    
    return {
      ...systemInfo,
      configPath: Paths.configFile,
      themesPath: Paths.themesDir,
      currentTheme: config.theme,
      soundEnabled: config.sound_enabled,
      volume: config.sound_volume
    };
  }


  /**
   * Complete uninstall of Claude Gamify
   */
  async uninstall() {
    const result = {
      success: false,
      removedHooks: 0,
      removedStyles: [],
      errors: []
    };

    try {

      // Step 1: Remove Claude Code hooks
      try {
        const hooksRemoved = await this.hookManager.remove();
        result.removedHooks = hooksRemoved;
      } catch (error) {
        result.errors.push(`Failed to remove hooks: ${error.message}`);
      }

      // Step 2: Clean output styles
      try {
        const gamifyThemes = await this.detectGamifyThemes();
        const stylesRemoved = await this.styleManager.cleanGamifyStyles(gamifyThemes);
        result.removedStyles = stylesRemoved;
      } catch (error) {
        result.errors.push(`Failed to clean styles: ${error.message}`);
      }

      // Step 3: Reset Claude output style if using gamify theme
      try {
        const gamifyThemes = await this.detectGamifyThemes();
        await this.styleManager.resetIfGamifyTheme(gamifyThemes);
      } catch (error) {
        result.errors.push(`Failed to reset output style: ${error.message}`);
      }

      // Step 4: Delete local installation
      try {
        await fs.rm(Paths.claudeGamifyDir, { recursive: true, force: true });
      } catch (error) {
        result.errors.push(`Failed to delete installation: ${error.message}`);
      }

      result.success = result.errors.length === 0;
      return result;
    } catch (error) {
      result.errors.push(`Uninstall failed: ${error.message}`);
      return result;
    }
  }



  /**
   * Detect all gamify theme names
   */
  async detectGamifyThemes() {
    const path = await import('path');
    const themes = new Set();
    
    // Check template themes
    try {
      const templateThemesDir = path.join(Paths.templateDir, 'themes');
      const templateThemes = await fs.readdir(templateThemesDir, { withFileTypes: true });
      for (const entry of templateThemes) {
        if (entry.isDirectory()) {
          themes.add(entry.name);
        }
      }
    } catch {
      // Template directory not accessible
    }
    
    // Check installed themes
    try {
      const installedThemes = await fs.readdir(Paths.themesDir, { withFileTypes: true });
      for (const entry of installedThemes) {
        if (entry.isDirectory()) {
          themes.add(entry.name);
        }
      }
    } catch {
      // Themes directory doesn't exist
    }
    
    return Array.from(themes);
  }

}

export { ClaudeSound };
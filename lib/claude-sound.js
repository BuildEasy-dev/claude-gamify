/**
 * Claude Sound Manager - Core system management
 * Handles configuration, themes, and Claude Code integration
 */

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { spawn } = require('child_process');
const { Paths, ConfigDefaults, FileUtils, SystemUtils, ConfigUtils } = require('./utils');

class ClaudeSound {
  constructor() {
    this.config = null;
  }

  /**
   * Initialize the manager - load config or throw if not initialized
   */
  async initialize() {
    try {
      await this.loadConfig();
    } catch (error) {
      throw new Error('NOT_INITIALIZED');
    }
  }

  /**
   * Load configuration from file
   */
  async loadConfig() {
    try {
      const configContent = await fs.readFile(Paths.configFile, 'utf8');
      this.config = ConfigUtils.mergeWithDefaults(JSON.parse(configContent));
    } catch (error) {
      throw new Error('Configuration file not found. Run initialization first.');
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig() {
    await FileUtils.writeJsonFile(Paths.configFile, this.config);
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
      await this.setupClaudeHooks();

      // Set up output styles
      spinner.text = 'Installing output styles...';
      await this.setupOutputStyles();

      // Initialize default configuration
      spinner.text = 'Setting up configuration...';
      await this.initializeConfiguration();

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
    await fs.mkdir(Paths.claudeGamifyDir, { recursive: true });
    await fs.mkdir(Paths.themesDir, { recursive: true });
    await fs.mkdir(path.dirname(Paths.claudeConfigPath), { recursive: true });
    await fs.mkdir(Paths.claudeOutputStylesDir, { recursive: true });
  }

  /**
   * Deploy system files from template
   */
  async deploySystemFiles() {
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
   * Set up Claude Code hooks
   */
  async setupClaudeHooks() {
    const hookCommands = ConfigDefaults.hookCommands;

    // Read existing Claude Code configuration
    const claudeConfig = await FileUtils.readJsonFile(Paths.claudeConfigPath, {});

    // Update hooks configuration with correct Claude Code format
    claudeConfig.hooks = claudeConfig.hooks || {};
    
    for (const hookName of hookCommands) {
      claudeConfig.hooks[hookName] = [
        {
          matcher: ".*",
          hooks: [
            {
              type: "command",
              command: `node "${Paths.indexPath}" ${hookName}`
            }
          ]
        }
      ];
    }

    // Write back configuration file
    await FileUtils.writeJsonFile(Paths.claudeConfigPath, claudeConfig);
  }

  /**
   * Set up Claude Code output styles from themes
   */
  async setupOutputStyles() {
    const templateThemesDir = path.join(Paths.templateDir, 'themes');
    
    try {
      // Get list of theme directories
      const themeNames = await fs.readdir(templateThemesDir, { withFileTypes: true });
      
      for (const themeEntry of themeNames) {
        if (themeEntry.isDirectory()) {
          const themeName = themeEntry.name;
          const themeOutputStylePath = path.join(templateThemesDir, themeName, 'output-style.md');
          
          // Check if this theme has an output style file
          try {
            await fs.access(themeOutputStylePath);
            
            // Copy to ~/.claude/output-styles with theme name prefix
            const targetPath = path.join(Paths.claudeOutputStylesDir, `${themeName}.md`);
            await fs.copyFile(themeOutputStylePath, targetPath);
            
          } catch (error) {
            // Output style file doesn't exist for this theme, skip
            continue;
          }
        }
      }
      
      // Set the default theme's output style in Claude settings
      await this.updateClaudeOutputStyle('zelda');
    } catch (error) {
      throw new Error(`Failed to set up output styles: ${error.message}`);
    }
  }

  /**
   * Initialize default configuration
   */
  async initializeConfiguration() {
    this.config = ConfigDefaults.defaultConfig;
    await this.saveConfig();
  }

  /**
   * List available themes
   */
  async listThemes() {
    const themes = [];
    
    try {
      const themeNames = await fs.readdir(Paths.themesDir);
      
      for (const themeName of themeNames) {
        const themePath = path.join(Paths.themesDir, themeName);
        const stat = await fs.stat(themePath);
        
        if (stat.isDirectory()) {
          let description = 'No description';
          try {
            const readmePath = path.join(themePath, 'README.md');
            const readmeContent = await fs.readFile(readmePath, 'utf8');
            // Extract first line as description
            const firstLine = readmeContent.split('\n')[0].replace(/^#+\s*/, '');
            if (firstLine.trim()) {
              description = firstLine.trim();
            }
          } catch {
            // README doesn't exist or can't be read
          }
          
          themes.push({ name: themeName, description });
        }
      }
    } catch (error) {
      // Themes directory doesn't exist
    }

    return themes;
  }

  /**
   * Update Claude's outputStyle setting for a theme
   */
  async updateClaudeOutputStyle(themeName) {
    try {
      // Read existing Claude settings
      const claudeConfig = await FileUtils.readJsonFile(Paths.claudeConfigPath, {});
      
      if (themeName === 'default') {
        // Remove outputStyle to restore default behavior
        delete claudeConfig.outputStyle;
      } else {
        // Check if the theme has an output style
        const outputStylePath = path.join(Paths.claudeOutputStylesDir, `${themeName}.md`);
        try {
          await fs.access(outputStylePath);
          // Update outputStyle setting
          claudeConfig.outputStyle = themeName;
        } catch {
          // No output style for this theme, remove the setting
          delete claudeConfig.outputStyle;
        }
      }
      
      // Write back configuration
      await FileUtils.writeJsonFile(Paths.claudeConfigPath, claudeConfig);
    } catch (error) {
      // Silently fail - output style is optional
      console.warn(`Could not update output style: ${error.message}`);
    }
  }

  /**
   * Set current theme
   */
  async setTheme(themeName) {
    const themes = await this.listThemes();
    const themeExists = themes.some(t => t.name === themeName);
    
    if (!themeExists) {
      throw new Error(`Theme "${themeName}" not found`);
    }
    
    this.config.theme = themeName;
    await this.saveConfig();
    
    // Also update Claude's output style if available
    await this.updateClaudeOutputStyle(themeName);
  }

  /**
   * Remove a theme
   */
  async removeTheme(themeName) {
    if (themeName === 'default' || themeName === 'system') {
      throw new Error('Cannot remove built-in themes');
    }

    const themePath = path.join(Paths.themesDir, themeName);
    
    try {
      await fs.access(themePath);
      await fs.rm(themePath, { recursive: true, force: true });
      
      // If current theme was removed, switch to default
      if (this.config.theme === themeName) {
        this.config.theme = 'zelda';
        await this.saveConfig();
      }
    } catch (error) {
      throw new Error(`Failed to remove theme: ${error.message}`);
    }
  }

  /**
   * Toggle sound on/off
   */
  async toggleSound() {
    this.config.sound_enabled = !this.config.sound_enabled;
    await this.saveConfig();
  }

  /**
   * Set volume (accepts 0-100 integer, stores as 0.0-1.0 float)
   */
  async setVolume(volume) {
    this.config.sound_volume = ConfigUtils.validateVolume(volume);
    await this.saveConfig();
  }

  /**
   * Test a single sound
   */
  async testSingleSound(hookName) {
    if (!this.config.sound_enabled) {
      console.log(chalk.yellow('Sound is disabled. Enable sound to test.'));
      return;
    }

    try {
      const player = spawn('node', [Paths.indexPath, hookName], {
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
   * Show quick status display
   */
  async showQuickStatus() {
    const statusText = this.config.sound_enabled ? 'ENABLED' : 'DISABLED';
    const volume = (this.config.sound_volume * 100).toFixed(0) + '%';
    const theme = this.config.theme;
    
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
  }

  /**
   * Export configuration
   */
  async exportConfig() {
    return { ...this.config };
  }

  /**
   * Import configuration
   */
  async importConfig(newConfig) {
    const filteredConfig = ConfigUtils.validateConfig(newConfig);
    this.config = { ...this.config, ...filteredConfig };
    await this.saveConfig();
  }

  /**
   * Get system information
   */
  async getSystemInfo() {
    const systemInfo = SystemUtils.getSystemInfo();
    
    return {
      ...systemInfo,
      configPath: Paths.configFile,
      themesPath: Paths.themesDir,
      currentTheme: this.config.theme,
      soundEnabled: this.config.sound_enabled,
      volume: this.config.sound_volume
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
        const hooksRemoved = await this.removeClaudeHooks();
        result.removedHooks = hooksRemoved;
      } catch (error) {
        result.errors.push(`Failed to remove hooks: ${error.message}`);
      }

      // Step 2: Clean output styles
      try {
        const stylesRemoved = await this.cleanOutputStyles();
        result.removedStyles = stylesRemoved;
      } catch (error) {
        result.errors.push(`Failed to clean styles: ${error.message}`);
      }

      // Step 3: Reset Claude output style if using gamify theme
      try {
        await this.resetClaudeOutputStyle();
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
   * Remove Claude Code hooks for gamify
   */
  async removeClaudeHooks() {
    let removedCount = 0;
    
    try {
      const claudeConfig = await FileUtils.readJsonFile(Paths.claudeConfigPath, {});
      
      if (claudeConfig.hooks) {
        const hookCommands = ConfigDefaults.hookCommands;
        
        for (const hookName of hookCommands) {
          if (claudeConfig.hooks[hookName]) {
            const originalLength = claudeConfig.hooks[hookName].length;
            
            claudeConfig.hooks[hookName] = claudeConfig.hooks[hookName].filter(hookEntry => {
              if (!hookEntry.hooks) return true;
              
              const originalHooksLength = hookEntry.hooks.length;
              hookEntry.hooks = hookEntry.hooks.filter(hook => 
                !hook.command || !hook.command.includes(Paths.indexPath)
              );
              
              if (hookEntry.hooks.length < originalHooksLength) {
                removedCount++;
              }
              
              return hookEntry.hooks.length > 0;
            });
            
            if (claudeConfig.hooks[hookName].length === 0) {
              delete claudeConfig.hooks[hookName];
            }
          }
        }
        
        if (Object.keys(claudeConfig.hooks).length === 0) {
          delete claudeConfig.hooks;
        }
      }
      
      await FileUtils.writeJsonFile(Paths.claudeConfigPath, claudeConfig);
    } catch (error) {
      // Claude settings file doesn't exist or is invalid
    }
    
    return removedCount;
  }

  /**
   * Clean output style files from gamify themes
   */
  async cleanOutputStyles() {
    const removedStyles = [];
    
    try {
      // Get list of all gamify themes
      const gamifyThemes = await this.detectGamifyThemes();
      
      for (const themeName of gamifyThemes) {
        const stylePath = path.join(Paths.claudeOutputStylesDir, `${themeName}.md`);
        try {
          await fs.access(stylePath);
          await fs.unlink(stylePath);
          removedStyles.push(`${themeName}.md`);
        } catch {
          // Style file doesn't exist, skip
        }
      }
    } catch (error) {
      // Output styles directory doesn't exist
    }
    
    return removedStyles;
  }

  /**
   * Detect all gamify theme names
   */
  async detectGamifyThemes() {
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

  /**
   * Reset Claude's output style if using a gamify theme
   */
  async resetClaudeOutputStyle() {
    try {
      const claudeConfig = await FileUtils.readJsonFile(Paths.claudeConfigPath, {});
      
      // Get list of gamify themes
      const gamifyThemes = await this.detectGamifyThemes();
      
      // Check if current output style is a gamify theme
      if (claudeConfig.outputStyle && gamifyThemes.includes(claudeConfig.outputStyle)) {
        delete claudeConfig.outputStyle;
        await FileUtils.writeJsonFile(Paths.claudeConfigPath, claudeConfig);
      }
    } catch (error) {
      // Claude settings file doesn't exist or is invalid
    }
  }
}

module.exports = { ClaudeSound };
/**
 * Claude Sound Manager - Core system management
 * Handles configuration, themes, and Claude Code integration
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const chalk = require('chalk');
const ora = require('ora');
const { spawn, execSync } = require('child_process');

class ClaudeSound {
  constructor() {
    this.homeDir = os.homedir();
    this.claudeGamifyDir = path.join(this.homeDir, '.claude-gamify');
    this.configFile = path.join(this.claudeGamifyDir, 'config.json');
    this.themesDir = path.join(this.claudeGamifyDir, 'themes');
    this.playerPath = path.join(this.claudeGamifyDir, 'play_sound.js');
    this.indexPath = path.join(this.claudeGamifyDir, 'index.js');
    this.claudeConfigPath = path.join(this.homeDir, '.claude', 'settings.json');
    
    this.templateDir = path.join(__dirname, '..', 'template');
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
    const defaultConfig = {
      theme: 'zelda',
      sound_enabled: true,
      sound_volume: 0.5
    };

    try {
      const configContent = await fs.readFile(this.configFile, 'utf8');
      this.config = { ...defaultConfig, ...JSON.parse(configContent) };
    } catch (error) {
      throw new Error('Configuration file not found. Run initialization first.');
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig() {
    await fs.writeFile(this.configFile, JSON.stringify(this.config, null, 2));
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
    await fs.mkdir(this.claudeGamifyDir, { recursive: true });
    await fs.mkdir(this.themesDir, { recursive: true });
    await fs.mkdir(path.dirname(this.claudeConfigPath), { recursive: true });
  }

  /**
   * Deploy system files from template
   */
  async deploySystemFiles() {
    // Copy all files from template directory
    const templateFiles = await fs.readdir(this.templateDir, { withFileTypes: true });
    
    for (const file of templateFiles) {
      const srcPath = path.join(this.templateDir, file.name);
      const destPath = path.join(this.claudeGamifyDir, file.name);
      
      if (file.isDirectory()) {
        // Recursively copy directory
        await this.copyDirectory(srcPath, destPath);
      } else {
        // Copy file
        await fs.copyFile(srcPath, destPath);
      }
    }

    // Make play_sound.js executable
    await fs.chmod(this.playerPath, 0o755);
  }

  /**
   * Recursively copy directory
   */
  async copyDirectory(src, dest) {
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
   * Set up Claude Code hooks
   */
  async setupClaudeHooks() {
    const hookCommands = [
      'SessionStart',
      'UserPromptSubmit', 
      'PreToolUse',
      'PostToolUse',
      'Notification',
      'Stop',
      'SubagentStop'
    ];

    // Read existing Claude Code configuration
    let claudeConfig = {};
    try {
      const content = await fs.readFile(this.claudeConfigPath, 'utf8');
      claudeConfig = JSON.parse(content);
    } catch {
      // File doesn't exist or is invalid, create new
      claudeConfig = {};
    }

    // Update hooks configuration with correct Claude Code format
    claudeConfig.hooks = claudeConfig.hooks || {};
    
    for (const hookName of hookCommands) {
      claudeConfig.hooks[hookName] = [
        {
          matcher: ".*",
          hooks: [
            {
              type: "command",
              command: `node "${this.indexPath}" ${hookName}`
            }
          ]
        }
      ];
    }

    // Write back configuration file
    await fs.writeFile(this.claudeConfigPath, JSON.stringify(claudeConfig, null, 2));
  }

  /**
   * Initialize default configuration
   */
  async initializeConfiguration() {
    this.config = {
      theme: 'zelda',
      sound_enabled: true,
      sound_volume: 0.5
    };
    await this.saveConfig();
  }

  /**
   * List available themes
   */
  async listThemes() {
    const themes = [];
    
    try {
      const themeNames = await fs.readdir(this.themesDir);
      
      for (const themeName of themeNames) {
        const themePath = path.join(this.themesDir, themeName);
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
  }

  /**
   * Remove a theme
   */
  async removeTheme(themeName) {
    if (themeName === 'default' || themeName === 'system') {
      throw new Error('Cannot remove built-in themes');
    }

    const themePath = path.join(this.themesDir, themeName);
    
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
   * Set volume (0.0 - 1.0)
   */
  async setVolume(volume) {
    if (volume < 0 || volume > 1) {
      throw new Error('Volume must be between 0 and 1');
    }
    
    this.config.sound_volume = volume;
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
      const player = spawn('node', [this.indexPath, hookName], {
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
    // Validate configuration
    const validKeys = ['theme', 'sound_enabled', 'sound_volume'];
    const filteredConfig = {};
    
    for (const key of validKeys) {
      if (newConfig.hasOwnProperty(key)) {
        filteredConfig[key] = newConfig[key];
      }
    }
    
    this.config = { ...this.config, ...filteredConfig };
    await this.saveConfig();
  }

  /**
   * Get system information
   */
  async getSystemInfo() {
    const audioPlayers = this.getAvailableAudioPlayers();
    
    return {
      platform: process.platform,
      nodeVersion: process.version,
      version: require('../package.json').version,
      configPath: this.configFile,
      themesPath: this.themesDir,
      audioPlayers,
      currentTheme: this.config.theme,
      soundEnabled: this.config.sound_enabled,
      volume: this.config.sound_volume
    };
  }

  /**
   * Get available audio players on current platform
   */
  getAvailableAudioPlayers() {
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
}

module.exports = { ClaudeSound };
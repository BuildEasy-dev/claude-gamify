/**
 * UI Components
 * Reusable UI elements for the CLI interface
 */

import chalk from 'chalk';
import boxen from 'boxen';
import figlet from 'figlet';
import ora from 'ora';
import os from 'os';
import { 
  COLORS, 
  BOX_STYLES, 
  ASCII_CONFIG, 
  STATUS_BAR,
  EXECUTION_HINTS,
  SOUND_CONFIG_UI,
  TEST_SOUNDS_UI,
  HOOK_NAMES,
  LAYOUT_PATTERNS
} from './constants.js';
import { ConfigDefaults } from '../utils.js';

/**
 * Welcome Screen Component
 * Displays the main welcome screen with ASCII art and update info
 */
export class WelcomeScreen {
  /**
   * Render the welcome screen
   * @param {Object} updateInfo - Optional update information
   * @param {string} updateInfo.latestVersion - Latest available version
   * @param {string} updateInfo.executionContext - How the tool was executed
   */
  static render(updateInfo = null) {
    console.clear();
    
    // Generate ASCII art
    const asciiArt = figlet.textSync('Claude Gamify', ASCII_CONFIG);
    
    // Build welcome content
    let welcomeContent = chalk.hex(COLORS.ACCENT)(asciiArt) + '\n\n' +
      chalk.bold('Welcome to Claude Gamify!\n\n');
    
    // Add update notice if available
    if (updateInfo) {
      const contextHint = this.getExecutionContextHint(updateInfo.executionContext);
      welcomeContent += chalk.yellow(
        `New version available: ${updateInfo.latestVersion} ${contextHint}\n\n`
      );
    }
    
    welcomeContent += chalk.gray('Use arrow keys to navigate, Enter to select, ESC to go back');
    
    // Display in styled box
    console.log(
      boxen(welcomeContent, BOX_STYLES.WELCOME)
    );
  }
  
  /**
   * Get execution context hint message
   * @private
   */
  static getExecutionContextHint(executionContext) {
    switch (executionContext) {
      case 'npx':
        return EXECUTION_HINTS.NPX;
      case 'global':
        return EXECUTION_HINTS.GLOBAL;
      case 'local':
        return EXECUTION_HINTS.LOCAL;
      default:
        return '';
    }
  }
}

/**
 * Status Bar Component
 * Displays current system status in a formatted bar
 */
export class StatusBar {
  /**
   * Render the status bar
   * @param {Object} config - Current configuration
   * @param {boolean} config.sound_enabled - Whether sound is enabled
   * @param {number} config.sound_volume - Volume level (0-1)
   * @param {string} config.theme - Active theme name
   */
  static render(config) {
    const statusText = config.sound_enabled ? 'ENABLED' : 'DISABLED';
    const volume = (config.sound_volume * 100).toFixed(0) + '%';
    const theme = config.theme;
    
    // Top border
    console.log(
      chalk.cyan(
        STATUS_BAR.CORNER_TOP_LEFT + 
        STATUS_BAR.BORDER_CHAR.repeat(STATUS_BAR.WIDTH + 2) + 
        STATUS_BAR.CORNER_TOP_RIGHT
      )
    );
    
    // Status content
    const statusContent = `Sound: ${chalk.bold(statusText)}  Theme: ${theme}  Volume: ${volume}`;
    const contentWidth = this.stripAnsi(statusContent).length;
    const padding = STATUS_BAR.WIDTH - contentWidth;
    
    console.log(
      chalk.cyan(STATUS_BAR.VERTICAL_CHAR + ' ') +
      statusContent +
      ' '.repeat(Math.max(0, padding)) +
      chalk.cyan(' ' + STATUS_BAR.VERTICAL_CHAR)
    );
    
    // Bottom border
    console.log(
      chalk.cyan(
        STATUS_BAR.CORNER_BOTTOM_LEFT + 
        STATUS_BAR.BORDER_CHAR.repeat(STATUS_BAR.WIDTH + 2) + 
        STATUS_BAR.CORNER_BOTTOM_RIGHT + '\n'
      )
    );
  }
  
  /**
   * Strip ANSI codes from string for length calculation
   * @private
   */
  static stripAnsi(str) {
    return str.replace(/\u001b\[[0-9;]*m/g, '');
  }
}

/**
 * System Info Display Component
 * Shows detailed system information
 */
export class SystemInfoDisplay {
  /**
   * Render system information with standardized layout
   * @param {Object} info - System information object
   */
  static render(info) {
    console.clear();
    
    // Title and separator (following Settings pattern)
    console.log(LAYOUT_PATTERNS.TITLE('System Information'));
    console.log(LAYOUT_PATTERNS.SEPARATOR_HEAVY());
    
    // Environment section
    console.log(LAYOUT_PATTERNS.SECTION_HEADER('Environment'));
    console.log();
    
    console.log(LAYOUT_PATTERNS.ITEM_LINE('Platform', chalk.yellow(info.platform), 20));
    console.log(LAYOUT_PATTERNS.ITEM_LINE('Node.js', chalk.yellow(info.nodeVersion), 20));
    console.log(LAYOUT_PATTERNS.ITEM_LINE('Claude Gamify', chalk.yellow(info.version), 20));
    
    // Audio system section
    console.log(LAYOUT_PATTERNS.SECTION_HEADER('Audio System'));
    console.log();
    
    const soundStatus = info.soundEnabled ? 
      chalk.green('✓ Enabled') : 
      chalk.red('✗ Disabled');
    const volumeBar = this.createVolumeBar(Math.round(info.volume * 100));
    const volumePercent = Math.round(info.volume * 100);
    const playersText = info.audioPlayers.length > 0 ? 
      chalk.green(info.audioPlayers.join(', ')) : 
      chalk.red('None found');
    
    console.log(LAYOUT_PATTERNS.ITEM_LINE('Status', soundStatus, 20));
    console.log(LAYOUT_PATTERNS.ITEM_LINE('Volume', `${volumeBar} ${volumePercent}%`, 20));
    console.log(LAYOUT_PATTERNS.ITEM_LINE('Theme', chalk.cyan(info.currentTheme), 20));
    console.log(LAYOUT_PATTERNS.ITEM_LINE('Players', playersText, 20));
    
    // File system section
    console.log(LAYOUT_PATTERNS.SECTION_HEADER('File System'));
    console.log();
    
    const configPath = this.shortenPath(info.configPath);
    const themesPath = this.shortenPath(info.themesPath);
    
    console.log(LAYOUT_PATTERNS.ITEM_LINE('Config', chalk.gray(configPath), 20));
    console.log(LAYOUT_PATTERNS.ITEM_LINE('Themes', chalk.gray(themesPath), 20));
    
    // Control hints
    const hints = ['[Enter] Continue'];
    console.log(LAYOUT_PATTERNS.CONTROL_BAR(hints));
  }
  
  /**
   * Create volume bar visualization
   * @param {number} percent - Volume percentage (0-100)
   * @returns {string} Volume bar string
   */
  static createVolumeBar(percent) {
    const barLength = 10;
    const filled = Math.round((percent / 100) * barLength);
    const empty = barLength - filled;
    return '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
  }
  
  /**
   * Shorten file paths for better display
   * @param {string} fullPath - Full file path
   * @returns {string} Shortened path
   */
  static shortenPath(fullPath) {
    const home = os.homedir();
    
    if (fullPath.startsWith(home)) {
      return fullPath.replace(home, '~');
    }
    
    // For very long paths, show first part and last part
    if (fullPath.length > 40) {
      const parts = fullPath.split('/');
      if (parts.length > 3) {
        return `${parts[0]}/.../${parts.slice(-2).join('/')}`;
      }
    }
    
    return fullPath;
  }
}

/**
 * Loading Spinner Component
 * Creates and manages loading spinners
 */
export class LoadingSpinner {
  /**
   * Create a new spinner
   * @param {string} text - Initial spinner text
   * @returns {Object} Ora spinner instance
   */
  static create(text) {
    return ora(text).start();
  }
  
  /**
   * Success spinner
   * @param {Object} spinner - Ora spinner instance
   * @param {string} text - Success message
   */
  static success(spinner, text) {
    spinner.succeed(text);
  }
  
  /**
   * Failure spinner
   * @param {Object} spinner - Ora spinner instance
   * @param {string} text - Failure message
   */
  static fail(spinner, text) {
    spinner.fail(text);
  }
  
  /**
   * Warning spinner
   * @param {Object} spinner - Ora spinner instance
   * @param {string} text - Warning message
   */
  static warn(spinner, text) {
    spinner.warn(text);
  }
}

/**
 * Message Box Component
 * Displays messages in styled boxes
 */
export class MessageBox {
  /**
   * Display an info box
   * @param {string} title - Box title
   * @param {string} content - Box content
   */
  static info(title, content) {
    console.log(
      boxen(
        chalk.cyan(title) + '\n\n' + content,
        BOX_STYLES.BASE
      )
    );
  }
  
  /**
   * Display a warning box
   * @param {string} title - Box title
   * @param {string} content - Box content
   */
  static warning(title, content) {
    console.log(
      boxen(
        chalk.red(title) + '\n\n' + chalk.yellow(content),
        BOX_STYLES.WARNING
      )
    );
  }
  
  /**
   * Display a success box
   * @param {string} title - Box title
   * @param {string} content - Box content
   */
  static success(title, content) {
    console.log(
      boxen(
        chalk.green(title) + '\n\n' + content,
        BOX_STYLES.BASE
      )
    );
  }
  
  /**
   * Display a custom box
   * @param {string} content - Box content
   * @param {Object} style - Box style configuration
   */
  static custom(content, style = BOX_STYLES.BASE) {
    console.log(boxen(content, style));
  }
}

/**
 * Theme Management Display Component
 * Standardized display following Settings design patterns
 */
export class ThemeManagementDisplay {
  /**
   * Render theme management screen with Settings-style layout
   * @param {Array} themes - List of theme objects
   * @param {string} currentTheme - Currently active theme
   */
  static render(themes, currentTheme) {
    console.clear();
    
    // Title and separator 
    console.log(LAYOUT_PATTERNS.TITLE('Theme Selection'));
    console.log(LAYOUT_PATTERNS.SEPARATOR_HEAVY());
    
    // Simplified theme list with current theme highlighted
    console.log(LAYOUT_PATTERNS.SECTION_HEADER('Available Themes'));
    console.log();
    
    themes.forEach(theme => {
      const isActive = theme.name === currentTheme;
      let status, line;
      
      if (isActive) {
        status = chalk.green('✓ Current');
        line = LAYOUT_PATTERNS.ITEM_LINE(theme.name, status, 18);
        console.log(LAYOUT_PATTERNS.HIGHLIGHT_ACTIVE(line));
      } else {
        status = theme.name === 'system' ? 
          chalk.cyan('Default') : 
          chalk.gray('Available');
        line = LAYOUT_PATTERNS.ITEM_LINE(theme.name, status, 18);
        console.log(line);
      }
    });
    
    // Control hints - simplified
    const hints = ['[Enter] Switch', '[R] Remove', '[ESC] Back'];
    console.log(LAYOUT_PATTERNS.CONTROL_BAR(hints));
  }
  
  /**
   * Format theme choices for inquirer (simplified for compatibility)
   * @param {Array} themes - List of theme objects  
   * @param {string} currentTheme - Currently active theme
   * @returns {Array} Formatted choices for inquirer
   */
  static formatChoices(themes, currentTheme) {
    return themes.map(theme => ({
      name: `${theme.name === currentTheme ? '✓' : ' '} ${theme.name}`,
      value: theme.name,
      short: theme.name
    }));
  }
}

/**
 * Legacy alias for backward compatibility
 */
export const ThemeListDisplay = ThemeManagementDisplay;

/**
 * Test Sounds Display Component  
 * Standardized display following Settings design patterns
 */
export class TestSoundsDisplay {
  /**
   * Render test sounds screen with Settings-style layout
   * @param {Object} config - Configuration object
   * @param {Object} hookStates - Hook enable/disable states
   */
  static render(config, hookStates) {
    console.clear();
    
    // Title and separator (following Settings pattern)
    console.log(LAYOUT_PATTERNS.TITLE('Sound Testing Laboratory'));
    console.log(LAYOUT_PATTERNS.SEPARATOR_HEAVY());
    
    // System status section
    console.log(LAYOUT_PATTERNS.SECTION_HEADER('System Status'));
    console.log();
    
    const soundStatus = config.sound_enabled ? 
      chalk.green('✓ Enabled') : 
      chalk.red('✗ Disabled');
    const volumeBar = this.createVolumeBar(Math.round(config.sound_volume * 100));
    const volumePercent = Math.round(config.sound_volume * 100);
    
    console.log(LAYOUT_PATTERNS.ITEM_LINE('Sound System', soundStatus, 20));
    console.log(LAYOUT_PATTERNS.ITEM_LINE('Master Volume', `${volumeBar} ${volumePercent}%`, 20));
    console.log(LAYOUT_PATTERNS.ITEM_LINE('Active Theme', chalk.cyan(config.theme), 20));
    
    // Hook status section
    const enabledCount = Object.values(hookStates).filter(state => state).length;
    const totalCount = HOOK_NAMES.length;
    
    console.log(LAYOUT_PATTERNS.SECTION_HEADER('Hook Status'));
    console.log();
    
    HOOK_NAMES.forEach(hook => {
      const isEnabled = hookStates[hook] && config.sound_enabled;
      const isGlobalDisabled = !config.sound_enabled;
      const isHookDisabled = !hookStates[hook];
      
      let status;
      let line;
      
      if (isGlobalDisabled) {
        status = chalk.dim('🔇 Muted');
        line = LAYOUT_PATTERNS.ITEM_LINE(hook, status, 20);
        console.log(LAYOUT_PATTERNS.HIGHLIGHT_DISABLED(line));
      } else if (isHookDisabled) {
        status = chalk.red('✗ Disabled');
        line = LAYOUT_PATTERNS.ITEM_LINE(hook, status, 20);
        console.log(LAYOUT_PATTERNS.HIGHLIGHT_DISABLED(line));
      } else {
        status = chalk.green('✓ Ready');
        line = LAYOUT_PATTERNS.ITEM_LINE(hook, status, 20);
        console.log(line);
      }
    });
    
    // Summary line
    const summaryLine = config.sound_enabled ? 
      LAYOUT_PATTERNS.ITEM_LINE('Total Active', chalk.green(`${enabledCount}/${totalCount} hooks`), 20) :
      LAYOUT_PATTERNS.ITEM_LINE('Total Active', chalk.red('Sound system disabled'), 20);
    
    console.log();
    console.log(LAYOUT_PATTERNS.HIGHLIGHT_ACTIVE(summaryLine));
    
    // Control hints
    const hints = ['[Enter] Test Selected', '[A] Test All Active', '[ESC] Back'];
    console.log(LAYOUT_PATTERNS.CONTROL_BAR(hints));
  }
  
  /**
   * Create volume bar visualization
   * @param {number} percent - Volume percentage (0-100)
   * @returns {string} Volume bar string
   */
  static createVolumeBar(percent) {
    const barLength = 10;
    const filled = Math.round((percent / 100) * barLength);
    const empty = barLength - filled;
    return '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
  }
}

/**
 * Uninstall Warning Display
 * Shows uninstall confirmation with details
 */
export class UninstallWarning {
  /**
   * Display uninstall warning
   */
  static render() {
    console.clear();
    
    const content = 
      chalk.red('⚠️  Uninstall Claude Gamify\n\n') +
      chalk.yellow('This will remove ALL Claude Gamify files and settings:\n') +
      chalk.gray('  • ~/.claude-gamify/ (all sound files & configuration)\n') +
      chalk.gray('  • ~/.claude/output-styles/<theme>.md (theme styles)\n') + 
      chalk.gray('  • Hook configurations from Claude Code settings\n') +
      chalk.gray('  • Reset output style if using gamify theme');
    
    console.log(boxen(content, BOX_STYLES.WARNING));
  }
  
  /**
   * Display uninstall results
   * @param {Object} result - Uninstall result object
   */
  static renderResults(result) {
    if (result.success) {
      console.log(chalk.green('✅ Claude Gamify has been completely uninstalled'));
      console.log(chalk.gray('\nRemoved:'));
      console.log(chalk.gray(`  • ${result.removedHooks} hook configurations`));
      console.log(chalk.gray(`  • ${result.removedStyles.length} output style files`));
      console.log(chalk.gray('  • All local installation files'));
      console.log(chalk.blue('\n👋 Thank you for using Claude Gamify!'));
      console.log(chalk.gray('You can reinstall anytime with: npx claude-gamify'));
    } else {
      console.log(chalk.yellow('⚠️  Uninstall completed with some errors'));
      
      if (result.errors.length > 0) {
        console.log(chalk.yellow('\n⚠️  Some operations failed:'));
        result.errors.forEach(err => {
          console.log(chalk.gray(`  • ${err}`));
        });
      }
    }
  }
}

/**
 * Version Check Display
 * Shows version check results
 */
export class VersionCheckDisplay {
  /**
   * Display update available message
   * @param {Object} updateInfo - Update information
   */
  static renderUpdateAvailable(updateInfo) {
    const contextHint = WelcomeScreen.getExecutionContextHint(updateInfo.executionContext);
    
    console.log(
      boxen(
        `${chalk.yellow('Update Available!')}\n\n` +
        `Current Version: ${chalk.red(updateInfo.currentVersion)}\n` +
        `Latest Version: ${chalk.green(updateInfo.latestVersion)}\n\n` +
        chalk.cyan(`Run: ${contextHint.replace(/[()]/g, '').replace('run: ', '')}`),
        {
          ...BOX_STYLES.BASE,
          title: 'Claude Gamify Version Check',
          titleAlignment: 'center'
        }
      )
    );
  }
  
  /**
   * Display up-to-date message
   * @param {string} version - Current version
   */
  static renderUpToDate(version) {
    console.log(
      boxen(
        `${chalk.green('You are using the latest version!')}\n\n` +
        `Current Version: ${chalk.green(version)}`,
        {
          ...BOX_STYLES.BASE,
          title: 'Claude Gamify Version Check',
          titleAlignment: 'center'
        }
      )
    );
  }
}

/**
 * Sound Configuration State Management
 * Manages the state for the sound configuration UI
 */
export class SoundConfigState {
  constructor(config) {
    this.sound_enabled = config.sound_enabled;
    this.sound_volume = config.sound_volume;
    this.sound_hooks = {...(config.sound_hooks || ConfigDefaults.defaultHookStates)};
    this.originalConfig = {...config};
    
    this.cursorPosition = 0;  // 0-1 for global, 2+ for hooks
    this.maxPosition = 1 + ConfigDefaults.defaultHookConfigs.length;
    this.isDirty = false;
  }
  
  navigate(direction) {
    if (direction === 'up') {
      this.cursorPosition = Math.max(0, this.cursorPosition - 1);
    } else {
      this.cursorPosition = Math.min(this.maxPosition, this.cursorPosition + 1);
    }
  }
  
  toggleCurrent() {
    if (this.cursorPosition === 0) {
      this.sound_enabled = !this.sound_enabled;
    } else if (this.cursorPosition >= 2) {
      const hookIndex = this.cursorPosition - 2;
      const hookConfig = ConfigDefaults.defaultHookConfigs[hookIndex];
      this.sound_hooks[hookConfig] = !this.sound_hooks[hookConfig];
    }
    this.isDirty = true;
  }
  
  adjustVolume(direction) {
    if (this.cursorPosition === 1) {
      const step = 0.05;
      if (direction === 'increase') {
        this.sound_volume = Math.min(1.0, this.sound_volume + step);
      } else {
        this.sound_volume = Math.max(0.0, this.sound_volume - step);
      }
      this.isDirty = true;
    }
  }
  
  setAllHooks(enabled) {
    ConfigDefaults.defaultHookConfigs.forEach(hookConfig => {
      this.sound_hooks[hookConfig] = enabled;
    });
    this.isDirty = true;
  }
  
  invertHooks() {
    ConfigDefaults.defaultHookConfigs.forEach(hookConfig => {
      this.sound_hooks[hookConfig] = !this.sound_hooks[hookConfig];
    });
    this.isDirty = true;
  }
  
  resetToDefaults() {
    this.sound_enabled = true;
    this.sound_volume = 0.5;
    this.sound_hooks = {...ConfigDefaults.defaultHookStates};
    this.isDirty = true;
  }
  
  hasChanges() {
    return this.isDirty;
  }
  
  toConfig() {
    return {
      sound_enabled: this.sound_enabled,
      sound_volume: this.sound_volume,
      sound_hooks: this.sound_hooks,
      theme: this.originalConfig.theme
    };
  }
}

/**
 * Sound Configuration Display Component
 * Renders the sound configuration UI
 */
export class SoundConfigDisplay {
  static render(state) {
    console.clear();
    
    // Title
    console.log(chalk.bold.hex(COLORS.ACCENT)('\n  Sound Configuration'));
    console.log(chalk.gray('  ' + '\u2550'.repeat(40)));
    
    // Global settings section
    this.renderGlobalSettings(state);
    
    // Hook controls section
    this.renderHookControls(state);
    
    // Control bar
    this.renderControlBar(state);
  }
  
  static renderGlobalSettings(state) {
    const { sound_enabled, sound_volume, cursorPosition } = state;
    
    console.log(chalk.bold(`\n  ${SOUND_CONFIG_UI.HEADERS.GLOBAL}:`));
    console.log();
    
    // Sound System toggle
    const soundSystemStatus = sound_enabled ? 
      chalk.green(SOUND_CONFIG_UI.STATUS.ENABLED) : 
      chalk.red(SOUND_CONFIG_UI.STATUS.DISABLED);
    const soundSystemLine = `  Sound System......[ ${soundSystemStatus} ]`;
    
    if (cursorPosition === 0) {
      console.log(chalk.bgHex('#444').white(soundSystemLine));
    } else {
      console.log(soundSystemLine);
    }
    
    // Volume control
    const volumePercent = Math.round(sound_volume * 100);
    const volumeBar = this.createVolumeBar(volumePercent);
    const volumeLine = `  Master Volume.....[ ${volumeBar} ${volumePercent.toString().padStart(3)}% ]`;
    
    if (cursorPosition === 1) {
      console.log(chalk.bgHex('#444').white(volumeLine));
    } else if (!sound_enabled) {
      console.log(chalk.dim(volumeLine));
    } else {
      console.log(volumeLine);
    }
  }
  
  static renderHookControls(state) {
    console.log(chalk.bold(`\n  ${SOUND_CONFIG_UI.HEADERS.HOOKS}:`));
    console.log();
    
    ConfigDefaults.defaultHookConfigs.forEach((hookConfig, index) => {
      const eventName = ConfigDefaults.configToEvent[hookConfig];
      const displayName = SOUND_CONFIG_UI.HOOK_DISPLAY_NAMES[eventName] || eventName;
      const status = state.sound_hooks[hookConfig] ? 
        chalk.green('\u2713') : 
        chalk.red('\u2717');
      
      const padding = '.'.repeat(Math.max(0, 20 - displayName.length));
      const line = `  ${displayName}${padding}[ ${status} ]`;
      
      if (state.cursorPosition === index + 2) {
        console.log(chalk.bgHex('#444').white(line));
      } else if (!state.sound_enabled) {
        console.log(chalk.dim(line));
      } else {
        console.log(line);
      }
    });
  }
  
  static renderControlBar(state) {
    console.log(chalk.gray('\n  ' + '\u2500'.repeat(40)));
    
    // Show shortcuts
    const shortcuts = SOUND_CONFIG_UI.CONTROL_HINTS.join(' ');
    console.log(chalk.gray(`  ${shortcuts}`));
    
    // Show dirty state
    if (state.hasChanges()) {
      console.log(chalk.yellow('\n  * Unsaved changes'));
    }
    console.log();
  }
  
  static createVolumeBar(percent) {
    const barLength = 10;
    const filled = Math.round((percent / 100) * barLength);
    const empty = barLength - filled;
    return '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
  }
}

/**
 * Interactive Test Sounds Display Component
 * Provides real-time visual feedback during sound testing with keyboard controls
 */
export class InteractiveTestSoundsDisplay {
  /**
   * Render interactive test sounds interface
   * @param {Object} config - Configuration object
   * @param {Object} hookStates - Hook enable/disable states
   * @param {Array} soundItems - Array of sound items
   * @param {number} currentIndex - Currently selected sound index
   * @param {string} playingSound - Currently playing sound name (if any)
   */
  static render(config, hookStates, soundItems, currentIndex, playingSound = null) {
    console.clear();
    console.log(LAYOUT_PATTERNS.TITLE('Interactive Sound Testing'));
    console.log(LAYOUT_PATTERNS.SEPARATOR_HEAVY());
    
    // Global sound status
    const soundStatus = config.sound_enabled ? 
      chalk.green('ENABLED') : 
      chalk.red('DISABLED');
    const volumePercent = Math.round(config.sound_volume * 100);
    const volumeBar = this.createVolumeBar(volumePercent);
    
    console.log(LAYOUT_PATTERNS.ITEM_LINE('Sound System', soundStatus, 20));
    console.log(LAYOUT_PATTERNS.ITEM_LINE('Master Volume', `${volumeBar} ${volumePercent}%`, 20));
    console.log(LAYOUT_PATTERNS.ITEM_LINE('Active Theme', chalk.cyan(config.theme), 20));
    
    // Hook status counts
    const enabledCount = Object.values(hookStates).filter(state => state).length;
    const totalCount = HOOK_NAMES.length;
    console.log(LAYOUT_PATTERNS.ITEM_LINE('Enabled Hooks', `${enabledCount}/${totalCount}`, 20));
    
    console.log(LAYOUT_PATTERNS.SECTION_HEADER('Sound Test Controls'));
    console.log();
    
    // Render sound list with selection cursor
    soundItems.forEach((item, index) => {
      const isSelected = index === currentIndex;
      const isPlaying = playingSound === item.name;
      const isEnabled = hookStates[item.name] && config.sound_enabled;
      const isGlobalDisabled = !config.sound_enabled;
      const isHookDisabled = !hookStates[item.name];
      
      let statusIcon, displayName, line;
      
      // Determine status icon and styling
      if (isPlaying) {
        statusIcon = TEST_SOUNDS_UI.STATUS_ICONS.PLAYING;
        displayName = chalk.cyan(`${statusIcon} ${item.displayName || item.name}`);
      } else if (isGlobalDisabled) {
        statusIcon = TEST_SOUNDS_UI.STATUS_ICONS.MUTED;
        displayName = chalk.dim(`${statusIcon} ${item.displayName || item.name}`);
      } else if (isHookDisabled) {
        statusIcon = TEST_SOUNDS_UI.STATUS_ICONS.DISABLED;
        displayName = chalk.dim.red(`${statusIcon} ${item.displayName || item.name}`);
      } else {
        statusIcon = TEST_SOUNDS_UI.STATUS_ICONS.ENABLED;
        displayName = chalk.green(`${statusIcon} ${item.displayName || item.name}`);
      }
      
      // Add selection cursor
      const cursor = isSelected ? '►' : ' ';
      line = `  ${cursor} ${displayName}`;
      
      // Highlight selected item
      if (isSelected) {
        console.log(LAYOUT_PATTERNS.HIGHLIGHT_ACTIVE(line));
      } else {
        console.log(line);
      }
    });
    
    // Control hints
    console.log(LAYOUT_PATTERNS.CONTROL_BAR(TEST_SOUNDS_UI.CONTROL_HINTS));
    
    // Show current status
    if (playingSound) {
      console.log(chalk.cyan(`  ♪ Playing: ${playingSound}...`));
    } else {
      console.log(chalk.gray('  Ready to test sounds'));
    }
    console.log();
  }
  
  /**
   * Create volume bar visualization
   * @param {number} percent - Volume percentage (0-100)
   * @returns {string} Visual volume bar
   */
  static createVolumeBar(percent) {
    const barLength = 10;
    const filled = Math.round((percent / 100) * barLength);
    const empty = barLength - filled;
    return '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
  }
}
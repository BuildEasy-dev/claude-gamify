/**
 * System Info Display Component
 * Shows detailed system information
 */

import chalk from 'chalk';
import os from 'os';
import { LAYOUT_PATTERNS } from '../../constants.js';

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
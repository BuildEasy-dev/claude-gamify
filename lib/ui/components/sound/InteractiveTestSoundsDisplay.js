/**
 * Interactive Test Sounds Display Component
 * Provides real-time visual feedback during sound testing with keyboard controls
 */

import chalk from 'chalk';
import { 
  LAYOUT_PATTERNS,
  HOOK_NAMES,
  TEST_SOUNDS_UI
} from '../../constants.js';

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
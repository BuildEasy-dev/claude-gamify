/**
 * Test Sounds Display Component  
 * Standardized display following Settings design patterns
 */

import chalk from 'chalk';
import { 
  LAYOUT_PATTERNS,
  HOOK_NAMES
} from '../../constants.js';

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
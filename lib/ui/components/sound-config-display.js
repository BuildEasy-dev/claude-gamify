/**
 * Sound Configuration Display Component
 * Renders the sound configuration UI
 */

import chalk from 'chalk';
import { 
  COLORS,
  SOUND_CONFIG_UI
} from '../constants.js';
import { ConfigDefaults } from '../../utils.js';

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
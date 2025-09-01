/**
 * Sound Configuration State Management
 * Manages the state for the sound configuration UI
 */

import { ConfigDefaults } from '../../../utils.js';

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
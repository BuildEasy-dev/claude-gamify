/**
 * Sound Navigation Handler
 * Specialized keyboard navigation for sound testing and configuration
 */

import keypress from 'keypress';
import { SOUND_CONFIG_UI, TEST_SOUNDS_UI } from '../constants/index.js';
import { PromptEscHandler } from './esc-handler.js';

/**
 * Sound Navigation Handler
 * Provides keyboard control for sound-related interactions
 */
export class SoundNavigationHandler {
  /**
   * Sound configuration keyboard navigator
   * @returns {Promise<Object>} Navigation action
   */
  static async soundConfigNavigator() {
    return new Promise((resolve) => {
      keypress(process.stdin);
      
      const handleKeypress = (ch, key) => {
        if (key) {
          let action = null;
          
          switch(key.name) {
            case SOUND_CONFIG_UI.SHORTCUTS.UP:
              action = { action: 'navigate', direction: 'up' };
              break;
            case SOUND_CONFIG_UI.SHORTCUTS.DOWN:
              action = { action: 'navigate', direction: 'down' };
              break;
            case SOUND_CONFIG_UI.SHORTCUTS.LEFT:
              action = { action: 'adjust', direction: 'decrease' };
              break;
            case SOUND_CONFIG_UI.SHORTCUTS.RIGHT:
              action = { action: 'adjust', direction: 'increase' };
              break;
            case SOUND_CONFIG_UI.SHORTCUTS.TOGGLE:
              action = { action: 'toggle' };
              break;
            case SOUND_CONFIG_UI.SHORTCUTS.ALL:
              action = { action: 'all' };
              break;
            case SOUND_CONFIG_UI.SHORTCUTS.NONE:
              action = { action: 'none' };
              break;
            case SOUND_CONFIG_UI.SHORTCUTS.INVERT:
              action = { action: 'invert' };
              break;
            case SOUND_CONFIG_UI.SHORTCUTS.RESET:
              action = { action: 'reset' };
              break;
            case SOUND_CONFIG_UI.SHORTCUTS.SAVE:
              action = { action: 'save' };
              break;
            case SOUND_CONFIG_UI.SHORTCUTS.CANCEL:
              action = { action: 'cancel' };
              break;
            case SOUND_CONFIG_UI.SHORTCUTS.EDIT:
              action = { action: 'edit' };
              break;
            case 'c':
              if (key.ctrl) {
                PromptEscHandler.handleExit();
              }
              break;
          }
          
          if (action) {
            process.stdin.removeListener('keypress', handleKeypress);
            process.stdin.setRawMode(false);
            process.stdin.pause();
            resolve(action);
          }
        }
      };
      
      process.stdin.on('keypress', handleKeypress);
      process.stdin.setRawMode(true);
      process.stdin.resume();
    });
  }

  /**
   * Interactive Test Sounds Navigation
   * Provides keyboard control for testing sounds with spacebar
   * @param {Array} soundItems - Array of sound items with names and states
   * @param {number} currentIndex - Currently selected index
   * @returns {Promise<Object>} Action object with type and data
   */
  static async testSoundsNavigator(soundItems, currentIndex = 0) {
    return new Promise((resolve) => {
      keypress(process.stdin);
      
      const handleKeypress = (ch, key) => {
        if (key) {
          let action = null;
          
          switch(key.name) {
            case TEST_SOUNDS_UI.SHORTCUTS.UP:
              const newUpIndex = currentIndex > 0 ? currentIndex - 1 : soundItems.length - 1;
              action = { action: 'navigate', direction: 'up', newIndex: newUpIndex };
              break;
            case TEST_SOUNDS_UI.SHORTCUTS.DOWN:
              const newDownIndex = currentIndex < soundItems.length - 1 ? currentIndex + 1 : 0;
              action = { action: 'navigate', direction: 'down', newIndex: newDownIndex };
              break;
            case TEST_SOUNDS_UI.SHORTCUTS.PLAY:
              action = { 
                action: 'play', 
                soundName: soundItems[currentIndex].name,
                index: currentIndex 
              };
              break;
            case TEST_SOUNDS_UI.SHORTCUTS.ALL:
              action = { action: 'play_all' };
              break;
            case TEST_SOUNDS_UI.SHORTCUTS.BACK:
              action = { action: 'back' };
              break;
            case 'c':
              if (key.ctrl) {
                PromptEscHandler.handleExit();
              }
              break;
          }
          
          if (action) {
            process.stdin.removeListener('keypress', handleKeypress);
            process.stdin.setRawMode(false);
            process.stdin.pause();
            resolve(action);
          }
        }
      };
      
      process.stdin.on('keypress', handleKeypress);
      process.stdin.setRawMode(true);
      process.stdin.resume();
    });
  }
}
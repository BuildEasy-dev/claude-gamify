/**
 * Prompts Module Index
 * Unified exports and backward compatibility layer
 */

import { PromptManagerCore } from './core.js';
import { PromptEscHandler } from './esc-handler.js';
import { MenuNavigatorCore } from './menu-navigator.js';
import { SoundNavigationHandler } from './sound-navigator.js';

/**
 * Backward Compatible PromptManager
 * Combines all prompt functionality into original API
 */
export class PromptManager {
  // ESC Handler methods
  static promptWithEsc = PromptEscHandler.promptWithEsc;
  static addBackOption = PromptEscHandler.addBackOption;
  static handleExit = PromptEscHandler.handleExit;
  static showMenu = PromptEscHandler.showMenu;
  
  // Core prompt methods
  static confirmAction = PromptManagerCore.confirmAction;
  static inputText = PromptManagerCore.inputText;
  static inputVolume = PromptManagerCore.inputVolume;
  static pressEnterToContinue = PromptManagerCore.pressEnterToContinue;
  static selectFromList = PromptManagerCore.selectFromList;
  static confirmWithInput = PromptManagerCore.confirmWithInput;
}

/**
 * Backward Compatible MenuNavigator
 * Combines navigation functionality into original API
 */
export class MenuNavigator {
  // Core navigation methods
  static handleNavigation = MenuNavigatorCore.handleNavigation;
  static clearScreen = MenuNavigatorCore.clearScreen;
  
  // Sound navigation methods
  static soundConfigNavigator = SoundNavigationHandler.soundConfigNavigator;
  static testSoundsNavigator = SoundNavigationHandler.testSoundsNavigator;
}

// New modular exports for future use
export { PromptManagerCore };
export { PromptEscHandler };
export { MenuNavigatorCore };
export { SoundNavigationHandler };
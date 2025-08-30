/**
 * Menu Controller
 * Handles interactive menu navigation and flow control
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { 
  WelcomeScreen, 
  StatusBar, 
  SystemInfoDisplay,
  ThemeListDisplay,
  SoundConfigState,
  SoundConfigDisplay
} from '../ui/components.js';
import { PromptManager, MenuNavigator } from '../ui/prompts.js';
import { 
  MESSAGES, 
  PROMPTS, 
  HOOK_NAMES,
  SOUND_TEST,
  MENU_CONFIG
} from '../ui/constants.js';

/**
 * MenuController Class
 * Coordinates all interactive menu flows
 */
export class MenuController {
  /**
   * Create a new MenuController instance
   * @param {ClaudeSound} manager - The main ClaudeSound manager
   */
  constructor(manager) {
    this.manager = manager;
  }

  /**
   * Show main menu loop
   * @param {Object} updateInfo - Update notification info
   */
  async showMainMenu(updateInfo = null) {
    const choices = [
      { name: 'Themes', value: 'themes' },
      { name: 'Settings', value: 'settings' },
      { name: 'Test Sounds', value: 'test' },
      { name: 'System Info', value: 'info' },
      new inquirer.Separator(),
      { name: 'Uninstall', value: 'uninstall' },
      { name: 'Exit', value: 'exit' }
    ];

    while (true) {
      await WelcomeScreen.render(updateInfo);
      const config = this.manager.configManager.getConfig();
      StatusBar.render(config);

      const { action } = await PromptManager.promptWithEsc({
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices,
        pageSize: MENU_CONFIG.PAGE_SIZE
      }, MENU_CONFIG.IGNORE_BACK_VALUE);

      try {
        switch (action) {
          case 'themes':
            await this.showThemesMenu();
            break;
          case 'settings':
            await this.showSettingsMenu();
            break;
          case 'test':
            await this.showTestSoundsMenu();
            break;
          case 'info':
            await this.showSystemInfo();
            break;
          case 'uninstall':
            return 'uninstall'; // Signal to parent to handle uninstall
          case 'exit':
            MenuNavigator.clearScreen();
            console.log(chalk.green(MESSAGES.EXIT));
            process.exit(0);
          case MENU_CONFIG.IGNORE_BACK_VALUE:
            // ESC pressed on main menu - ignore and continue
            continue;
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        await PromptManager.pressEnterToContinue();
      }
    }
  }

  /**
   * Show themes management menu
   */
  async showThemesMenu() {
    while (true) {
      await WelcomeScreen.render();
      const config = this.manager.configManager.getConfig();
      StatusBar.render(config);
      
      const themes = await this.manager.listThemes();
      const currentTheme = config.theme;

      const choices = ThemeListDisplay.formatChoices(themes, currentTheme);

      choices.push(
        new inquirer.Separator(),
        { name: 'Remove Theme', value: 'remove' },
        { name: 'Back', value: 'back' },
        { name: 'Exit', value: 'exit' }
      );

      const { choice } = await PromptManager.promptWithEsc({
        type: 'list',
        name: 'choice',
        message: 'Theme Management:',
        choices,
        pageSize: MENU_CONFIG.THEMES_PAGE_SIZE
      }, 'back');

      if (choice === 'back') {
        return;
      }
      if (choice === 'exit') {
        MenuNavigator.clearScreen();
        console.log(chalk.green(MESSAGES.EXIT));
        process.exit(0);
      }
      if (choice === 'remove') {
        await this.removeThemeFlow();
        continue;
      }

      // Switch theme
      await this.manager.setTheme(choice);
      // No additional prompt, just continue to refresh the menu
    }
  }

  /**
   * Show settings menu - now delegates to unified sound configuration
   */
  async showSettingsMenu() {
    return await this.showSoundConfigMenu();
  }

  /**
   * Unified Sound Configuration Menu
   * Provides comprehensive control over sound settings and individual hook states
   */
  async showSoundConfigMenu() {
    const config = await this.manager.configManager.load();
    const state = new SoundConfigState(config);
    
    while (true) {
      // Render current state
      SoundConfigDisplay.render(state);
      
      // Handle input
      const action = await MenuNavigator.soundConfigNavigator();
      
      if (action.action === 'save') {
        await this.saveSoundConfig(state);
        break;
      } else if (action.action === 'cancel') {
        if (await this.confirmCancel(state)) break;
      } else {
        this.handleSoundConfigAction(state, action);
      }
    }
  }

  /**
   * Handle sound configuration actions
   * @param {SoundConfigState} state - Current configuration state
   * @param {Object} action - Action to perform
   */
  handleSoundConfigAction(state, action) {
    switch (action.action) {
      case 'navigate':
        state.navigate(action.direction);
        break;
      case 'adjust':
        state.adjustVolume(action.direction);
        break;
      case 'toggle':
        state.toggleCurrent();
        break;
      case 'all':
        state.setAllHooks(true);
        break;
      case 'none':
        state.setAllHooks(false);
        break;
      case 'invert':
        state.invertHooks();
        break;
      case 'reset':
        state.resetToDefaults();
        break;
    }
  }

  /**
   * Save sound configuration
   * @param {SoundConfigState} state - Configuration state to save
   */
  async saveSoundConfig(state) {
    try {
      const newConfig = state.toConfig();
      await this.manager.configManager.import(newConfig);
      console.log(chalk.green('\n  ✓ Configuration saved!'));
      await PromptManager.pressEnterToContinue();
    } catch (error) {
      console.log(chalk.red(`\n  ✗ Error saving configuration: ${error.message}`));
      await PromptManager.pressEnterToContinue();
    }
  }

  /**
   * Confirm cancel with unsaved changes
   * @param {SoundConfigState} state - Configuration state
   * @returns {boolean} True if should cancel
   */
  async confirmCancel(state) {
    if (!state.hasChanges()) {
      return true;
    }
    
    const { confirm } = await PromptManager.promptWithEsc({
      type: 'confirm',
      name: 'confirm',
      message: 'You have unsaved changes. Discard them?',
      default: false
    }, false);
    
    return confirm;
  }

  /**
   * Show test sounds menu with hook state indicators
   */
  async showTestSoundsMenu() {
    const config = await this.manager.configManager.load();
    
    // Get hook states
    const hookStates = {};
    for (const hook of HOOK_NAMES) {
      hookStates[hook] = await this.manager.configManager.getHookState(hook);
    }
    
    // Count enabled hooks
    const enabledCount = Object.values(hookStates).filter(state => state).length;
    const totalCount = HOOK_NAMES.length;
    
    // Build choices with status indicators
    const hookChoices = HOOK_NAMES.map(hook => {
      const isEnabled = hookStates[hook] && config.sound_enabled;
      const isGlobalDisabled = !config.sound_enabled;
      const isHookDisabled = !hookStates[hook];
      
      let displayName;
      let name;
      
      if (isGlobalDisabled) {
        // Global sound disabled - show muted icon
        displayName = `🔇 ${hook}`;
        name = chalk.dim(displayName);
      } else if (isHookDisabled) {
        // Hook specifically disabled - show red cross and dim
        displayName = `✗ ${hook}`;
        name = chalk.dim.red(displayName);
      } else {
        // Hook enabled - show green checkmark
        displayName = `✓ ${hook}`;
        name = chalk.green(displayName);
      }
      
      return { name, value: hook, disabled: false };
    });
    
    // Build Test All option with status count
    const testAllName = config.sound_enabled 
      ? `Test All Sounds [${enabledCount}/${totalCount} hooks enabled]`
      : `Test All Sounds [Sound Globally Disabled]`;

    const { choice } = await PromptManager.promptWithEsc({
      type: 'list',
      name: 'choice',
      message: 'Test Sounds:',
      choices: [
        { name: testAllName, value: 'all' },
        new inquirer.Separator(),
        ...hookChoices,
        new inquirer.Separator(),
        { name: 'Back', value: 'back' },
        { name: 'Exit', value: 'exit' }
      ],
      loop: false
    }, 'back');

    if (choice === 'back') {
      MenuNavigator.clearScreen();
      return;
    }
    if (choice === 'exit') {
      MenuNavigator.clearScreen();
      console.log(chalk.green(MESSAGES.EXIT));
      process.exit(0);
    }

    if (choice === 'all') {
      if (!config.sound_enabled) {
        console.log(chalk.yellow('⚠️  Sound is globally disabled. Enable sound in Settings to test.'));
      } else {
        const enabledHooks = HOOK_NAMES.filter(hook => hookStates[hook]);
        const disabledCount = HOOK_NAMES.length - enabledHooks.length;
        
        if (enabledHooks.length === 0) {
          console.log(chalk.yellow('⚠️  All hooks are disabled. Enable hooks in Settings to test.'));
        } else {
          console.log(chalk.blue(`Testing ${enabledHooks.length} enabled sounds${disabledCount > 0 ? ` (${disabledCount} hooks disabled)` : ''}...`));
          for (const hook of enabledHooks) {
            console.log(chalk.gray(`Playing ${hook}...`));
            await this.manager.testSingleSound(hook);
            await new Promise(resolve => setTimeout(resolve, SOUND_TEST.DELAY_BETWEEN_SOUNDS));
          }
          console.log(chalk.green('All enabled sounds tested!'));
        }
      }
    } else {
      // Individual hook testing
      const isEnabled = hookStates[choice] && config.sound_enabled;
      const isGlobalDisabled = !config.sound_enabled;
      const isHookDisabled = !hookStates[choice];
      
      if (isGlobalDisabled) {
        console.log(chalk.yellow(`⚠️  Sound is globally disabled - testing ${choice} anyway...`));
      } else if (isHookDisabled) {
        console.log(chalk.yellow(`⚠️  ${choice} hook is disabled - testing anyway...`));
      } else {
        console.log(chalk.blue(`Playing ${choice}...`));
      }
      
      await this.manager.testSingleSound(choice);
    }

    await PromptManager.pressEnterToContinue();
  }

  /**
   * Show system information
   */
  async showSystemInfo() {
    const info = await this.manager.getSystemInfo();
    SystemInfoDisplay.render(info);
    await PromptManager.pressEnterToContinue();
  }

  /**
   * Handle theme removal flow
   */
  async removeThemeFlow() {
    const themes = await this.manager.listThemes();
    const removableThemes = themes.filter(t => t.name !== 'system');
    
    if (removableThemes.length === 0) {
      console.log(chalk.yellow(MESSAGES.NO_CUSTOM_THEMES));
      await PromptManager.pressEnterToContinue();
      MenuNavigator.clearScreen();
      return;
    }

    const { themeToRemove } = await PromptManager.promptWithEsc({
      type: 'list',
      name: 'themeToRemove',
      message: 'Select theme to remove:',
      choices: [
        ...removableThemes.map(t => ({ name: t.name, value: t.name })),
        new inquirer.Separator(),
        { name: 'Back', value: 'back' },
        { name: 'Exit', value: 'exit' }
      ]
    }, 'back');

    if (themeToRemove === 'back') {
      MenuNavigator.clearScreen();
      return;
    }
    if (themeToRemove === 'exit') {
      MenuNavigator.clearScreen();
      console.log(chalk.green(MESSAGES.EXIT));
      process.exit(0);
    }

    const confirmed = await PromptManager.confirmAction(
      `${PROMPTS.CONFIRM_THEME_REMOVE} "${themeToRemove}"?`,
      false
    );

    if (confirmed) {
      await this.manager.removeTheme(themeToRemove);
      console.log(chalk.green(`Theme "${themeToRemove}" removed successfully.`));
    }
    
    await PromptManager.pressEnterToContinue();
    MenuNavigator.clearScreen();
  }

}
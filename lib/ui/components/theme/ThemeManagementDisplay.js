/**
 * Theme Management Display Component
 * Standardized display following Settings design patterns
 */

import chalk from 'chalk';
import { LAYOUT_PATTERNS } from '../../constants.js';

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
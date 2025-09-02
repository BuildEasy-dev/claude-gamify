/**
 * Uninstall Warning Display
 * Shows uninstall confirmation with details
 */

import chalk from 'chalk';
import boxen from 'boxen';
import { BOX_STYLES } from '../constants/index.js';

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
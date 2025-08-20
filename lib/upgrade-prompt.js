/**
 * Upgrade Prompt - Smart upgrade guidance and user interaction
 * Handles upgrade notifications and provides context-specific instructions
 */

const chalk = require('chalk');
const boxen = require('boxen');
const inquirer = require('inquirer');

class UpgradePrompt {
  constructor() {
    this.sessionSilent = false; // Track if user chose to silence for this session
  }

  /**
   * Show upgrade notice with version information and user options
   * Returns user choice: 'show_methods', 'skip', or 'silent'
   */
  async showUpgradeNotice(updateInfo) {
    if (this.sessionSilent) {
      return 'silent';
    }

    const { currentVersion, latestVersion, executionContext } = updateInfo;
    
    // Create a visually appealing upgrade notice
    const noticeTitle = chalk.yellow('New Version Available!');
    const versionInfo = `Current Version: ${chalk.red(currentVersion)}\nLatest Version: ${chalk.green(latestVersion)}`;
    const contextHint = this.getContextHint(executionContext);
    
    const noticeContent = `${versionInfo}\nExecution Method: ${contextHint}\n\nUpgrade to get the latest features and fixes!`;
    
    const styledNotice = boxen(noticeContent, {
      title: noticeTitle,
      titleAlignment: 'center',
      borderStyle: 'single',
      borderColor: 'yellow',
      padding: 1,
      margin: 1
    });

    console.log(styledNotice);

    // Prompt user for action
    const choices = [
      { name: 'View Upgrade Methods', value: 'show_methods' },
      { name: 'Skip This Notification', value: 'skip' },
      { name: 'Silence for This Session', value: 'silent' }
    ];

    const answer = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'Choose an action:',
      choices: choices
    }]);

    if (answer.action === 'silent') {
      this.sessionSilent = true;
    }

    return answer.action;
  }

  /**
   * Show detailed upgrade methods based on execution context
   */
  async showUpgradeMethods(updateInfo) {
    const { executionContext, latestVersion } = updateInfo;
    
    console.log(chalk.blue('\nUpgrade Guide'));
    console.log(chalk.gray('=' * 50));

    switch (executionContext) {
      case 'npx':
        this.showNpxUpgradeGuide(latestVersion);
        break;
      case 'global':
        this.showGlobalUpgradeGuide();
        break;
      case 'local':
        this.showLocalUpgradeGuide();
        break;
      default:
        this.showGenericUpgradeGuide(latestVersion);
    }

    console.log(chalk.gray('=' * 50));
    console.log(chalk.green('Choose the upgrade method that suits your current environment'));
    
    // Wait for user to read the instructions
    await inquirer.prompt([{
      type: 'input',
      name: 'continue',
      message: 'Press Enter to continue...'
    }]);
  }

  /**
   * Show upgrade guide for NPX users
   */
  showNpxUpgradeGuide(latestVersion) {
    console.log(chalk.yellow('\nNPX User Upgrade Methods:\n'));
    
    console.log(chalk.white('Method 1: Use latest version tag'));
    console.log(chalk.cyan(`  npx claude-gamify@latest`));
    console.log(chalk.gray('  This will run the latest version directly\n'));
    
    console.log(chalk.white('Method 2: Specify exact version'));
    console.log(chalk.cyan(`  npx claude-gamify@${latestVersion}`));
    console.log(chalk.gray('  Ensures using the specific version\n'));
    
    console.log(chalk.white('Method 3: Clear NPX cache'));
    console.log(chalk.cyan(`  npx --yes claude-gamify@latest`));
    console.log(chalk.gray('  Forces re-download of latest version\n'));
    
    console.log(chalk.magenta('Tip: NPX caches downloaded packages, using @latest ensures you get the latest version'));
  }

  /**
   * Show upgrade guide for global installation users
   */
  showGlobalUpgradeGuide() {
    console.log(chalk.yellow('\nGlobal Installation User Upgrade Methods:\n'));
    
    console.log(chalk.white('Method 1: Use npm update'));
    console.log(chalk.cyan('  npm update -g claude-gamify'));
    console.log(chalk.gray('  Updates to the latest version\n'));
    
    console.log(chalk.white('Method 2: Reinstall'));
    console.log(chalk.cyan('  npm uninstall -g claude-gamify'));
    console.log(chalk.cyan('  npm install -g claude-gamify@latest'));
    console.log(chalk.gray('  Ensures complete cleanup and reinstallation\n'));
    
    console.log(chalk.white('Method 3: Check current version'));
    console.log(chalk.cyan('  claude-gamify --version'));
    console.log(chalk.gray('  Verify if upgrade was successful\n'));
    
    console.log(chalk.red('Warning: Global installation may require administrator privileges (sudo)'));
  }

  /**
   * Show upgrade guide for local installation users
   */
  showLocalUpgradeGuide() {
    console.log(chalk.yellow('\nLocal Installation User Upgrade Methods:\n'));
    
    console.log(chalk.white('Method 1: Update package.json'));
    console.log(chalk.cyan('  Edit claude-gamify version in package.json'));
    console.log(chalk.cyan('  npm install'));
    console.log(chalk.gray('  Manually specify version and install\n'));
    
    console.log(chalk.white('Method 2: Use npm update'));
    console.log(chalk.cyan('  npm update claude-gamify'));
    console.log(chalk.gray('  Updates to latest version within allowed range\n'));
    
    console.log(chalk.white('Method 3: Reinstall specific version'));
    console.log(chalk.cyan('  npm install claude-gamify@latest'));
    console.log(chalk.gray('  Install latest version\n'));
    
    console.log(chalk.magenta('Strategy Tip: Check your project\'s package.json configuration to determine the best upgrade strategy'));
  }

  /**
   * Show generic upgrade guide when context is unclear
   */
  showGenericUpgradeGuide(latestVersion) {
    console.log(chalk.yellow('\nGeneric Upgrade Methods:\n'));
    
    console.log(chalk.white('If you\'re using NPX:'));
    console.log(chalk.cyan(`  npx claude-gamify@${latestVersion}\n`));
    
    console.log(chalk.white('If you have it globally installed:'));
    console.log(chalk.cyan('  npm update -g claude-gamify\n'));
    
    console.log(chalk.white('If you have it locally installed in a project:'));
    console.log(chalk.cyan('  npm update claude-gamify\n'));
    
    console.log(chalk.blue('Tip: Use npm ls claude-gamify to check current installation method'));
  }

  /**
   * Get context hint for display
   */
  getContextHint(executionContext) {
    switch (executionContext) {
      case 'npx':
        return chalk.blue('NPX Execution');
      case 'global':
        return chalk.green('Global Installation');
      case 'local':
        return chalk.yellow('Local Installation');
      default:
        return chalk.gray('Unknown');
    }
  }

  /**
   * Generate upgrade message for different contexts (for quick display)
   */
  generateUpgradeMessage(updateInfo) {
    const { currentVersion, latestVersion, executionContext } = updateInfo;
    
    let message = `New version found: ${currentVersion} -> ${latestVersion}\n`;
    
    switch (executionContext) {
      case 'npx':
        message += `Recommended: npx claude-gamify@latest`;
        break;
      case 'global':
        message += `Recommended: npm update -g claude-gamify`;
        break;
      case 'local':
        message += `Recommended: npm update claude-gamify`;
        break;
      default:
        message += `Run claude-gamify upgrade to see detailed upgrade methods`;
    }
    
    return message;
  }

  /**
   * Reset session silence (for testing or manual reset)
   */
  resetSessionSilence() {
    this.sessionSilent = false;
  }
}

module.exports = { UpgradePrompt };
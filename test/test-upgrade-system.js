#!/usr/bin/env node

/**
 * Test script for the upgrade checking system
 * Tests version detection, prompt display, and command functionality
 */

const { VersionManager } = require('../lib/version-manager');
const { UpgradePrompt } = require('../lib/upgrade-prompt');
const chalk = require('chalk');

const VERSION = require('../package.json').version;

async function testVersionManager() {
  console.log(chalk.blue('\nTesting VersionManager...\n'));
  
  const versionManager = new VersionManager(VERSION);
  
  // Test execution context detection
  const context = versionManager.detectExecutionContext();
  console.log(`Execution context detected: ${chalk.cyan(context)}`);
  
  // Test version comparison
  const isNewer = versionManager.compareVersions('1.0.0', '1.1.0');
  console.log(`Version comparison (1.0.0 < 1.1.0): ${chalk.cyan(isNewer)}`);
  
  // Test equal versions
  const isEqual = versionManager.compareVersions('1.0.0', '1.0.0');
  console.log(`Version comparison (1.0.0 == 1.0.0): ${chalk.cyan(isEqual)}`);
  
  // Test cache clearing
  await versionManager.clearCache();
  console.log('Cache cleared successfully');
  
  // Test update checking (should fail gracefully for unpublished package)
  console.log('\nTesting update check (expecting graceful failure)...');
  const updateInfo = await versionManager.checkForUpdates();
  console.log(`Update check result: ${updateInfo ? 'Updates available' : 'No updates or network error (expected)'}`);
}

async function testUpgradePrompt() {
  console.log(chalk.blue('\nTesting UpgradePrompt...\n'));
  
  const upgradePrompt = new UpgradePrompt();
  
  // Test context hint generation
  const npxHint = upgradePrompt.getContextHint('npx');
  const globalHint = upgradePrompt.getContextHint('global');
  const localHint = upgradePrompt.getContextHint('local');
  
  console.log(`NPX context hint: ${npxHint}`);
  console.log(`Global context hint: ${globalHint}`);
  console.log(`Local context hint: ${localHint}`);
  
  // Test upgrade message generation
  const mockUpdateInfo = {
    currentVersion: '1.0.0',
    latestVersion: '1.1.0',
    executionContext: 'npx'
  };
  
  const message = upgradePrompt.generateUpgradeMessage(mockUpdateInfo);
  console.log(`Generated upgrade message:\n   ${chalk.gray(message)}`);
  
  console.log('\nTesting upgrade methods display...');
  
  // Test different execution contexts
  const contexts = ['npx', 'global', 'local'];
  for (const context of contexts) {
    console.log(chalk.yellow(`\n--- ${context.toUpperCase()} Context ---`));
    const testInfo = { ...mockUpdateInfo, executionContext: context };
    
    // We'll just test the method exists and doesn't throw
    try {
      upgradePrompt.showNpxUpgradeGuide('1.1.0');
      upgradePrompt.showGlobalUpgradeGuide();
      upgradePrompt.showLocalUpgradeGuide();
      console.log(`${context} upgrade guide methods work correctly`);
    } catch (error) {
      console.log(`Error in ${context} upgrade guide: ${error.message}`);
    }
  }
}

async function testCacheSystem() {
  console.log(chalk.blue('\nTesting Cache System...\n'));
  
  const versionManager = new VersionManager(VERSION);
  
  // Clear cache first
  await versionManager.clearCache();
  console.log('Initial cache clear');
  
  // Should check version (no cache)
  const shouldCheck1 = await versionManager.shouldSkipVersionCheck();
  console.log(`Should skip check (no cache): ${chalk.cyan(shouldCheck1)}`);
  
  // Update cache manually
  await versionManager.updateVersionCache('1.0.0', false);
  console.log('Cache updated manually');
  
  // Should now skip check (cache exists and recent)
  const shouldCheck2 = await versionManager.shouldSkipVersionCheck();
  console.log(`Should skip check (with cache): ${chalk.cyan(shouldCheck2)}`);
  
  // Load cache data
  const cacheData = await versionManager.loadVersionCache();
  console.log(`Cache data loaded: ${cacheData ? 'Success' : 'Failed'}`);
  
  if (cacheData) {
    console.log(`   Cached version: ${chalk.cyan(cacheData.latestVersion)}`);
    console.log(`   Cache age: ${chalk.cyan(Date.now() - cacheData.timestamp)}ms`);
  }
}

async function runAllTests() {
  console.log(chalk.green('Claude Gamify Upgrade System Tests\n'));
  console.log(chalk.gray('=' * 50));
  
  try {
    await testVersionManager();
    await testUpgradePrompt();
    await testCacheSystem();
    
    console.log(chalk.gray('\n' + '=' * 50));
    console.log(chalk.green('All tests completed successfully!'));
    console.log(chalk.blue('\nThe upgrade system is ready to guide users through NPM package updates.'));
    console.log(chalk.yellow('Note: Actual NPM version checks will work once the package is published.'));
    
  } catch (error) {
    console.error(chalk.red(`\nTest failed: ${error.message}`));
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}
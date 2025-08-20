#!/usr/bin/env node

/**
 * Test script for uninstall functionality
 * Tests the uninstall methods without actually running them
 */

const { ClaudeSound } = require('../lib/claude-sound');
const chalk = require('chalk');

async function testUninstallMethods() {
  console.log(chalk.blue('🧪 Testing Uninstall Functionality\n'));
  
  const manager = new ClaudeSound();
  let testsPassed = 0;
  let totalTests = 0;
  
  // Test 1: ClaudeSound class has uninstall method
  totalTests++;
  if (typeof manager.uninstall === 'function') {
    console.log(chalk.green('✅ ClaudeSound.uninstall method exists'));
    testsPassed++;
  } else {
    console.log(chalk.red('❌ ClaudeSound.uninstall method missing'));
  }
  
  // Test 2: Helper methods exist
  const helperMethods = ['removeClaudeHooks', 'cleanOutputStyles', 'detectGamifyThemes', 'resetClaudeOutputStyle'];
  for (const method of helperMethods) {
    totalTests++;
    if (typeof manager[method] === 'function') {
      console.log(chalk.green(`✅ ClaudeSound.${method} method exists`));
      testsPassed++;
    } else {
      console.log(chalk.red(`❌ ClaudeSound.${method} method missing`));
    }
  }
  
  // Test 3: Test detectGamifyThemes (safe to run)
  totalTests++;
  try {
    const themes = await manager.detectGamifyThemes();
    console.log(chalk.green('✅ detectGamifyThemes works'));
    console.log(chalk.gray(`   Found themes: ${themes.join(', ')}`));
    testsPassed++;
  } catch (error) {
    console.log(chalk.red(`❌ detectGamifyThemes failed: ${error.message}`));
  }
  
  // Test 4: Test uninstall method structure (dry run)
  totalTests++;
  try {
    // Mock the file system operations to test structure without side effects
    const originalRM = require('fs').promises.rm;
    const originalWriteFile = require('fs').promises.writeFile;
    const originalReadFile = require('fs').promises.readFile;
    const originalUnlink = require('fs').promises.unlink;
    
    // Create non-destructive mocks
    require('fs').promises.rm = async () => { throw new Error('Mock: would delete directory'); };
    require('fs').promises.writeFile = async () => { throw new Error('Mock: would write file'); };
    require('fs').promises.readFile = async () => { throw new Error('Mock: config not found'); };
    require('fs').promises.unlink = async () => { throw new Error('Mock: would delete file'); };
    
    const result = await manager.uninstall({ backup: false });
    
    // Restore original methods
    require('fs').promises.rm = originalRM;
    require('fs').promises.writeFile = originalWriteFile;
    require('fs').promises.readFile = originalReadFile;
    require('fs').promises.unlink = originalUnlink;
    
    if (result && typeof result === 'object' && 
        result.hasOwnProperty('success') && 
        result.hasOwnProperty('errors') &&
        Array.isArray(result.errors)) {
      console.log(chalk.green('✅ Uninstall method returns correct structure'));
      console.log(chalk.gray(`   Result: success=${result.success}, errors=${result.errors.length}`));
      testsPassed++;
    } else {
      console.log(chalk.red('❌ Uninstall method returns incorrect structure'));
    }
  } catch (error) {
    console.log(chalk.red(`❌ Uninstall method structure test failed: ${error.message}`));
  }
  
  // Summary
  console.log('\n' + chalk.blue('📊 Test Results:'));
  console.log(`Tests passed: ${chalk.green(testsPassed)}/${totalTests}`);
  
  if (testsPassed === totalTests) {
    console.log(chalk.green('🎉 All tests passed! Uninstall functionality is ready.'));
    process.exit(0);
  } else {
    console.log(chalk.red('❌ Some tests failed. Please check the implementation.'));
    process.exit(1);
  }
}

// Run tests
testUninstallMethods().catch(error => {
  console.error(chalk.red(`Test runner failed: ${error.message}`));
  process.exit(1);
});
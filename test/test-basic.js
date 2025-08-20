#!/usr/bin/env node

/**
 * Basic tests for claude-gamify NPX package
 */

const { ClaudeSound } = require('../lib/claude-sound');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function runTests() {
  console.log('🧪 Running basic tests for claude-gamify...\n');
  
  let passed = 0;
  let failed = 0;
  
  function test(name, fn) {
    try {
      fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failed++;
    }
  }
  
  // Test 1: ClaudeSound class can be instantiated
  test('ClaudeSound class instantiation', () => {
    const manager = new ClaudeSound();
    if (!manager || typeof manager.initialize !== 'function') {
      throw new Error('Manager not properly initialized');
    }
  });
  
  // Test 2: Template directory exists
  test('Template directory exists', () => {
    const templateDir = path.join(__dirname, '..', 'template');
    if (!fs.existsSync(templateDir)) {
      throw new Error('Template directory not found');
    }
  });
  
  // Test 3: Required template files exist
  test('Required template files exist', () => {
    const templateDir = path.join(__dirname, '..', 'template');
    const requiredFiles = ['play_sound.js', 'config.json', 'index.js', 'README.md'];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(templateDir, file))) {
        throw new Error(`Required template file missing: ${file}`);
      }
    }
  });
  
  // Test 4: Package.json has correct structure
  test('Package.json structure', () => {
    const pkg = require('../package.json');
    
    if (!pkg.name || pkg.name !== 'claude-gamify') {
      throw new Error('Package name incorrect');
    }
    
    if (!pkg.bin || !pkg.bin['claude-gamify']) {
      throw new Error('Binary not configured');
    }
    
    if (!pkg.dependencies || !pkg.dependencies.commander) {
      throw new Error('Required dependencies missing');
    }
  });
  
  // Test 5: CLI entry point is executable
  test('CLI entry point', () => {
    const cliPath = path.join(__dirname, '..', 'bin', 'cli.js');
    if (!fs.existsSync(cliPath)) {
      throw new Error('CLI entry point not found');
    }
    
    const stats = fs.statSync(cliPath);
    if (!(stats.mode & parseInt('111', 8))) {
      throw new Error('CLI entry point not executable');
    }
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('❌ Some tests failed');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
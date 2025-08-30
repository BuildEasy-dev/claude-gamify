#!/usr/bin/env node

/**
 * Test hook state functionality
 * Validates the enhanced test sounds menu can read hook states correctly
 */

import path from 'path';
import os from 'os';
import { ClaudeSound } from '../lib/orchestrator.js';
import { HOOK_NAMES } from '../lib/ui/constants.js';

const SUCCESS = '✅';
const FAILED = '❌';

console.log('🧪 Testing hook state functionality...\n');

async function testHookStates() {
  try {
    // Use the real config path
    const configPath = path.join(os.homedir(), '.claude-gamify');
    const manager = new ClaudeSound(configPath);
    
    // Test 1: Check if we can load config
    console.log('Testing config loading...');
    const config = await manager.configManager.load();
    console.log(`${SUCCESS} Config loaded successfully`);
    
    // Test 2: Check hook state retrieval
    console.log('\nTesting hook state retrieval...');
    for (const hook of HOOK_NAMES.slice(0, 3)) { // Test first 3 hooks
      const state = await manager.configManager.getHookState(hook);
      console.log(`${SUCCESS} ${hook}: ${state ? 'enabled' : 'disabled'}`);
    }
    
    // Test 3: Check overall sound state
    console.log(`\nGlobal sound state: ${config.sound_enabled ? 'enabled' : 'disabled'}`);
    console.log(`${SUCCESS} Hook state functionality working correctly`);
    
    return true;
  } catch (error) {
    console.error(`${FAILED} Hook state test failed:`, error.message);
    return false;
  }
}

// Run test
const success = await testHookStates();

console.log('\n📊 Hook State Test Results:');
if (success) {
  console.log(`${SUCCESS} Hook state functionality test passed!`);
  process.exit(0);
} else {
  console.log(`${FAILED} Hook state functionality test failed!`);
  process.exit(1);
}
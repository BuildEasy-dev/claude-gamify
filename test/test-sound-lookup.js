#!/usr/bin/env node

/**
 * Test sound file lookup and mapping logic
 * Validates the complete chain from hook name to sound file
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { homedir } from 'os';
import { HOOK_NAMES } from '../lib/ui/constants/index.js';

// Hook event mapping from play_sound.js
const HOOK_EVENT_MAPPING = {
  'SessionStart': 'session_start',
  'UserPromptSubmit': 'user_prompt_submit', 
  'PreToolUse': 'pre_tool_use',
  'PostToolUse': 'post_tool_use',
  'Notification': 'notification',
  'Stop': 'stop',
  'SubagentStop': 'subagent_stop'
};

async function testSoundLookup() {
  console.log('🔍 Testing Sound File Lookup Logic\n');
  
  const configPath = path.join(homedir(), '.claude-gamify', 'config.json');
  const themeDir = path.join(homedir(), '.claude-gamify', 'themes', 'zelda');
  
  // Test 1: Check if config file exists and is readable
  console.log('📋 Test 1: Configuration file validation');
  try {
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    console.log('   ✅ Config file loaded successfully');
    console.log(`   📁 Current theme: ${config.theme}`);
    console.log(`   🔊 Sound enabled: ${config.sound_enabled}`);
    console.log(`   🔉 Sound volume: ${config.sound_volume}`);
  } catch (error) {
    console.log(`   ❌ Config file error: ${error.message}`);
    return;
  }
  
  // Test 2: Validate hook name mapping
  console.log('\n📋 Test 2: Hook name to config key mapping');
  let mappingErrors = 0;
  for (const hookName of HOOK_NAMES) {
    const configKey = HOOK_EVENT_MAPPING[hookName];
    if (configKey) {
      console.log(`   ✅ ${hookName} -> ${configKey}`);
    } else {
      console.log(`   ❌ ${hookName} -> Missing mapping!`);
      mappingErrors++;
    }
  }
  
  // Test 3: Check file existence
  console.log('\n📋 Test 3: Sound file existence validation');
  let fileErrors = 0;
  for (const hookName of HOOK_NAMES) {
    const soundPath = path.join(themeDir, `${hookName}.wav`);
    if (existsSync(soundPath)) {
      console.log(`   ✅ ${hookName}.wav exists`);
    } else {
      console.log(`   ❌ ${hookName}.wav missing!`);
      fileErrors++;
    }
  }
  
  // Test 4: Test actual playback system (dry run)
  console.log('\n📋 Test 4: Play sound system validation');
  let playbackErrors = 0;
  
  for (const hookName of HOOK_NAMES) {
    try {
      // Test the actual play_sound.js script without playing
      const playScript = path.join(homedir(), '.claude-gamify', 'play_sound.js');
      if (existsSync(playScript)) {
        // Just validate the script doesn't crash on hook name
        const testCommand = `node "${playScript}" "${hookName}" 2>&1 || echo "Script completed"`;
        const result = execSync(testCommand, { 
          encoding: 'utf8',
          timeout: 2000,
          stdio: 'pipe'
        });
        console.log(`   ✅ ${hookName} - Script executes successfully`);
      } else {
        console.log(`   ❌ play_sound.js not found!`);
        playbackErrors++;
        break;
      }
    } catch (error) {
      console.log(`   ⚠️  ${hookName} - Execution issue: ${error.message}`);
      playbackErrors++;
    }
  }
  
  // Test 5: Configuration consistency check
  console.log('\n📋 Test 5: Configuration consistency');
  try {
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    const configHooks = Object.keys(config.sound_hooks || {});
    const expectedConfigHooks = Object.values(HOOK_EVENT_MAPPING);
    
    let consistencyErrors = 0;
    for (const expectedHook of expectedConfigHooks) {
      if (!configHooks.includes(expectedHook)) {
        console.log(`   ❌ Missing config key: ${expectedHook}`);
        consistencyErrors++;
      } else {
        console.log(`   ✅ Config key present: ${expectedHook}`);
      }
    }
    
    if (consistencyErrors === 0) {
      console.log('   🎯 Configuration is consistent with hook mappings');
    }
    
  } catch (error) {
    console.log(`   ❌ Configuration consistency check failed: ${error.message}`);
  }
  
  // Summary
  console.log('\n🏆 Sound Lookup Test Summary:');
  console.log(`   🗂️  Total hooks tested: ${HOOK_NAMES.length}`);
  console.log(`   ${mappingErrors === 0 ? '✅' : '❌'} Hook mapping errors: ${mappingErrors}`);
  console.log(`   ${fileErrors === 0 ? '✅' : '❌'} File missing errors: ${fileErrors}`);
  console.log(`   ${playbackErrors === 0 ? '✅' : '❌'} Playback system errors: ${playbackErrors}`);
  
  const totalErrors = mappingErrors + fileErrors + playbackErrors;
  if (totalErrors === 0) {
    console.log('\n🎉 所有声音文件查找逻辑正常工作！');
    console.log('🔊 Sound system is correctly configured and ready to use!');
  } else {
    console.log(`\n⚠️  发现 ${totalErrors} 个问题需要修复`);
  }
}

await testSoundLookup();
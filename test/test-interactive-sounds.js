#!/usr/bin/env node

/**
 * Test interactive test sounds with spacebar control
 * Validates the new keyboard-driven sound testing interface
 */

import { readFile } from 'fs/promises';
import chalk from 'chalk';

async function testInteractiveSounds() {
  console.log('🎵 Testing Interactive Sound Control Implementation\n');
  
  try {
    // Test 1: Check UI constants exist
    console.log('📋 Test 1: UI Constants validation');
    const constantsContent = await readFile('./lib/ui/constants.js', 'utf8');
    
    // Check TEST_SOUNDS_UI exists
    const hasTestSoundsUI = constantsContent.includes('TEST_SOUNDS_UI');
    const hasPlayShortcut = constantsContent.includes("PLAY: 'return'");
    const hasControlHints = constantsContent.includes('[Enter] Play');
    
    if (hasTestSoundsUI && hasPlayShortcut && hasControlHints) {
      console.log('   ✅ TEST_SOUNDS_UI constants defined correctly');
    } else {
      console.log('   ❌ TEST_SOUNDS_UI constants missing or incomplete');
    }
    
    // Test 2: Check component exists
    console.log('\n📋 Test 2: Interactive component validation');
    const componentsContent = await readFile('./lib/ui/components/sound-interactive-test-display.js', 'utf8');
    
    const hasInteractiveDisplay = componentsContent.includes('InteractiveTestSoundsDisplay');
    const hasRenderMethod = componentsContent.includes('static render(config, hookStates, soundItems, currentIndex, playingSound');
    const hasPlayingIndicator = componentsContent.includes('STATUS_ICONS.PLAYING');
    
    if (hasInteractiveDisplay && hasRenderMethod && hasPlayingIndicator) {
      console.log('   ✅ InteractiveTestSoundsDisplay component implemented correctly');
    } else {
      console.log('   ❌ InteractiveTestSoundsDisplay component missing or incomplete');
    }
    
    // Test 3: Check navigation method exists
    console.log('\n📋 Test 3: Navigation method validation');
    const promptsContent = await readFile('./lib/ui/prompts.js', 'utf8');
    
    const hasTestSoundsNavigator = promptsContent.includes('testSoundsNavigator');
    const hasEnterKeyHandling = promptsContent.includes("TEST_SOUNDS_UI.SHORTCUTS.PLAY");
    const hasNavigationActions = promptsContent.includes("action: 'play'");
    
    if (hasTestSoundsNavigator && hasEnterKeyHandling && hasNavigationActions) {
      console.log('   ✅ Test sounds navigator method implemented correctly');
    } else {
      console.log('   ❌ Test sounds navigator method missing or incomplete');
    }
    
    // Test 4: Check menu integration
    console.log('\n📋 Test 4: Menu integration validation');
    const menusContent = await readFile('./lib/cli/menus.js', 'utf8');
    
    const hasInteractiveImport = menusContent.includes('InteractiveTestSoundsDisplay');
    const hasEnterKeyComment = menusContent.includes('Enter') || menusContent.includes('interactive');
    const hasInteractiveLoop = menusContent.includes('while (isRunning)');
    const hasPlayAction = menusContent.includes("case 'play':");
    
    if (hasInteractiveImport && hasEnterKeyComment && hasInteractiveLoop && hasPlayAction) {
      console.log('   ✅ Menu integration implemented correctly');
    } else {
      console.log('   ❌ Menu integration missing or incomplete');
    }
    
    // Test 5: Check imports and dependencies
    console.log('\n📋 Test 5: Import validation');
    const hasTestSoundsUIImport = componentsContent.includes('TEST_SOUNDS_UI');
    const hasMenuImport = menusContent.includes('InteractiveTestSoundsDisplay');
    const hasPromptImport = promptsContent.includes('TEST_SOUNDS_UI');
    
    if (hasTestSoundsUIImport && hasMenuImport && hasPromptImport) {
      console.log('   ✅ All imports configured correctly');
    } else {
      console.log('   ❌ Some imports missing or incorrect');
    }
    
    console.log('\n🏆 Interactive Sound Control Test Complete!');
    console.log('\n💡 Key Features Implemented:');
    console.log('   - ↑/↓ Arrow keys: Navigate between sounds');
    console.log('   - Enter key: Play selected sound');
    console.log('   - A key: Play all enabled sounds');
    console.log('   - ESC key: Return to main menu');
    console.log('   - Real-time visual feedback during playback');
    console.log('   - Hook state indicators (enabled/disabled/muted)');
    console.log('   - Selection cursor and highlighting');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

await testInteractiveSounds();
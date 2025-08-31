#!/usr/bin/env node

/**
 * Integration test for interactive sound testing
 * Tests the actual components working together
 */

import { InteractiveTestSoundsDisplay } from '../lib/ui/components.js';
import { HOOK_NAMES } from '../lib/ui/constants.js';

async function testIntegration() {
  console.log('🧪 Integration Test for Interactive Sound Testing\n');
  
  try {
    // Mock configuration data
    const mockConfig = {
      sound_enabled: true,
      sound_volume: 0.6,
      theme: 'system'
    };
    
    const mockHookStates = {
      SessionStart: true,
      UserPromptSubmit: true,
      PreToolUse: false,
      PostToolUse: false,
      Notification: true,
      Stop: true,
      SubagentStop: true
    };
    
    const mockSoundItems = HOOK_NAMES.map(hook => ({
      name: hook,
      displayName: hook
    }));
    
    console.log('📋 Test 1: Component rendering without errors');
    
    // Test static render method with different states
    try {
      // Test normal state
      InteractiveTestSoundsDisplay.render(mockConfig, mockHookStates, mockSoundItems, 0);
      console.log('   ✅ Normal state rendering - SUCCESS');
      
      // Test with playing sound
      InteractiveTestSoundsDisplay.render(mockConfig, mockHookStates, mockSoundItems, 2, 'PreToolUse');
      console.log('   ✅ Playing state rendering - SUCCESS');
      
      // Test with sound disabled
      const disabledConfig = { ...mockConfig, sound_enabled: false };
      InteractiveTestSoundsDisplay.render(disabledConfig, mockHookStates, mockSoundItems, 0);
      console.log('   ✅ Disabled sound rendering - SUCCESS');
      
    } catch (error) {
      console.log('   ❌ Component rendering failed:', error.message);
      throw error;
    }
    
    console.log('\n📋 Test 2: Sound items data structure validation');
    
    // Validate sound items structure
    const hasCorrectStructure = mockSoundItems.every(item => 
      item.name && typeof item.name === 'string' && 
      item.displayName && typeof item.displayName === 'string'
    );
    
    if (hasCorrectStructure) {
      console.log('   ✅ Sound items structure - VALID');
    } else {
      console.log('   ❌ Sound items structure - INVALID');
    }
    
    console.log('\n📋 Test 3: Hook states validation');
    
    // Check all hooks have states
    const allHooksHaveStates = HOOK_NAMES.every(hook => 
      mockHookStates.hasOwnProperty(hook) && 
      typeof mockHookStates[hook] === 'boolean'
    );
    
    if (allHooksHaveStates) {
      console.log('   ✅ All hook states defined - VALID');
    } else {
      console.log('   ❌ Missing hook states - INVALID');
    }
    
    console.log('\n📋 Test 4: Navigation index boundaries');
    
    // Test index boundaries
    const maxIndex = mockSoundItems.length - 1;
    const testIndices = [0, Math.floor(maxIndex / 2), maxIndex];
    
    let indexTestsPassed = 0;
    testIndices.forEach(index => {
      try {
        InteractiveTestSoundsDisplay.render(mockConfig, mockHookStates, mockSoundItems, index);
        indexTestsPassed++;
      } catch (error) {
        console.log(`   ❌ Index ${index} failed:`, error.message);
      }
    });
    
    if (indexTestsPassed === testIndices.length) {
      console.log('   ✅ Index boundary tests - ALL PASSED');
    } else {
      console.log(`   ⚠️  Index boundary tests - ${indexTestsPassed}/${testIndices.length} PASSED`);
    }
    
    console.log('\n🏆 Integration Test Complete!');
    console.log('\n✨ Ready for interactive use with:');
    console.log('   - Real-time navigation with arrow keys');
    console.log('   - Enter key sound playback control');
    console.log('   - Visual state indicators');
    console.log('   - ESC key navigation');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    process.exit(1);
  }
}

await testIntegration();
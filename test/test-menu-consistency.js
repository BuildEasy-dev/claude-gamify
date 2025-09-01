#!/usr/bin/env node

/**
 * Test menu navigation consistency
 * Validates that all secondary menus have consistent navigation patterns
 */

import { readFile } from 'fs/promises';

async function testMenuConsistency() {
  console.log('🧪 Testing Menu Navigation Consistency\n');
  
  try {
    // Read the menus.js file
    const menusContent = await readFile('./lib/cli/menus.js', 'utf8');
    
    // Test 1: Check that Themes menu doesn't have "Exit" in choices
    console.log('📋 Test 1: Themes menu navigation choices');
    
    const themesMenuMatch = menusContent.match(/showThemesMenu[\s\S]*?choices\.push\(\s*[\s\S]*?\);/);
    if (themesMenuMatch) {
      const themesChoices = themesMenuMatch[0];
      const hasExit = themesChoices.includes("'Exit'") || themesChoices.includes('"Exit"');
      const hasBack = themesChoices.includes("'Back'") || themesChoices.includes('"Back"');
      
      if (!hasExit && hasBack) {
        console.log('   ✅ Themes menu: Only has Back option (no Exit) - CONSISTENT');
      } else if (hasExit && hasBack) {
        console.log('   ❌ Themes menu: Has both Back and Exit options - INCONSISTENT');
      } else {
        console.log('   ⚠️  Themes menu: Unexpected navigation pattern');
      }
    } else {
      console.log('   ⚠️  Could not find Themes menu choices');
    }
    
    // Test 2: Check that TestSounds menu doesn't have "Exit" in choices
    console.log('\n📋 Test 2: TestSounds menu navigation choices');
    
    const testSoundsMenuMatch = menusContent.match(/showTestSoundsMenu[\s\S]*?choices:\s*\[[\s\S]*?\]/);
    if (testSoundsMenuMatch) {
      const testSoundsChoices = testSoundsMenuMatch[0];
      const hasExit = testSoundsChoices.includes("'Exit'") || testSoundsChoices.includes('"Exit"');
      const hasBack = testSoundsChoices.includes("'Back'") || testSoundsChoices.includes('"Back"');
      
      if (!hasExit && hasBack) {
        console.log('   ✅ TestSounds menu: Only has Back option (no Exit) - CONSISTENT');
      } else if (hasExit && hasBack) {
        console.log('   ❌ TestSounds menu: Has both Back and Exit options - INCONSISTENT');
      } else {
        console.log('   ⚠️  TestSounds menu: Unexpected navigation pattern');
      }
    } else {
      console.log('   ⚠️  Could not find TestSounds menu choices');
    }
    
    // Test 3: Check that removeThemeFlow doesn't have "Exit" in choices  
    console.log('\n📋 Test 3: Remove theme flow navigation choices');
    
    const removeThemeMatch = menusContent.match(/removeThemeFlow[\s\S]*?choices:\s*\[[\s\S]*?\]/);
    if (removeThemeMatch) {
      const removeThemeChoices = removeThemeMatch[0];
      const hasExit = removeThemeChoices.includes("'Exit'") || removeThemeChoices.includes('"Exit"');
      const hasBack = removeThemeChoices.includes("'Back'") || removeThemeChoices.includes('"Back"');
      
      if (!hasExit && hasBack) {
        console.log('   ✅ Remove theme flow: Only has Back option (no Exit) - CONSISTENT');
      } else if (hasExit && hasBack) {
        console.log('   ❌ Remove theme flow: Has both Back and Exit options - INCONSISTENT');
      } else {
        console.log('   ⚠️  Remove theme flow: Unexpected navigation pattern');
      }
    } else {
      console.log('   ⚠️  Could not find Remove theme flow choices');
    }
    
    // Test 4: Check that exit handling code is removed
    console.log('\n📋 Test 4: Exit handling code removal');
    
    const exitHandlings = (menusContent.match(/if \([\w\s]+ === 'exit'\)/g) || []).length;
    if (exitHandlings === 0) {
      console.log('   ✅ No explicit exit handling in secondary menus - CONSISTENT');
    } else {
      console.log(`   ❌ Found ${exitHandlings} explicit exit handling blocks - INCONSISTENT`);
    }
    
    console.log('\n🏆 Menu Consistency Test Complete!');
    console.log('\n💡 Expected navigation pattern:');
    console.log('   - ESC key: Go back to previous menu');
    console.log('   - Ctrl+C: Exit entire application');
    console.log('   - No explicit "Exit" options in secondary menus');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

await testMenuConsistency();
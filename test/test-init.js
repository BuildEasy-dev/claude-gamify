#!/usr/bin/env node

/**
 * Test initialization flow for claude-gamify
 */

import { ClaudeSound } from '../lib/orchestrator.js';
import { Paths } from '../lib/utils.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

async function testInitialization() {
  console.log('🧪 Testing claude-gamify initialization flow...\n');
  
  const manager = new ClaudeSound();
  
  // Note: Testing uses the standard ~/.claude-gamify directory
  // We'll backup and restore if it exists to avoid interfering with real installation
  const backupDir = path.join(os.homedir(), '.claude-gamify-backup-test');
  const gamifyDir = Paths.claudeGamifyDir;
  let hadExistingInstall = false;
  
  let success = true;
  
  try {
    // Backup existing installation if present
    if (fs.existsSync(gamifyDir)) {
      hadExistingInstall = true;
      if (fs.existsSync(backupDir)) {
        fs.rmSync(backupDir, { recursive: true, force: true });
      }
      fs.renameSync(gamifyDir, backupDir);
      console.log('💾 Backed up existing installation');
    }
    
    console.log('1. Testing fresh initialization...');
    
    // Test that initialization is needed
    try {
      await manager.initialize();
      console.log('❌ Should have thrown NOT_INITIALIZED error');
      success = false;
    } catch (error) {
      if (error.message === 'NOT_INITIALIZED') {
        console.log('✅ Correctly detected uninitialized system');
      } else {
        console.log(`❌ Unexpected error: ${error.message}`);
        success = false;
      }
    }
    
    console.log('2. Testing initialization process...');
    
    // Run initialization
    await manager.init();
    
    // Check if files were created
    const requiredFiles = [
      'config.json',
      'index.js', 
      'play_sound.js',
      'README.md'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(gamifyDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} created successfully`);
      } else {
        console.log(`❌ ${file} not found`);
        success = false;
      }
    }
    
    // Check if themes directory was created
    const themesPath = path.join(gamifyDir, 'themes');
    if (fs.existsSync(themesPath)) {
      console.log('✅ themes directory created');
      
      // Check for theme subdirectories
      const themes = fs.readdirSync(themesPath);
      if (themes.includes('zelda') && themes.includes('system')) {
        console.log('✅ system themes installed');
      } else {
        console.log(`❌ missing themes: ${themes.join(', ')}`);
        success = false;
      }
    } else {
      console.log('❌ themes directory not found');
      success = false;
    }
    
    console.log('3. Testing post-initialization functionality...');
    
    // Test that we can now initialize successfully
    try {
      await manager.initialize();
      console.log('✅ Initialization successful after setup');
    } catch (error) {
      console.log(`❌ Failed to initialize after setup: ${error.message}`);
      success = false;
    }
    
    // Test configuration loading
    const config = manager.configManager.getConfig();
    if (config) {
      console.log('✅ Configuration loaded successfully');
      console.log(`   Theme: ${config.theme}`);
      console.log(`   Enabled: ${config.sound_enabled}`);
      console.log(`   Volume: ${(config.sound_volume * 100).toFixed(0)}%`);
    } else {
      console.log('❌ Configuration not loaded');
      success = false;
    }
    
    // Test theme listing
    const themes = await manager.listThemes();
    if (themes.length > 0) {
      console.log(`✅ Found ${themes.length} themes: ${themes.map(t => t.name).join(', ')}`);
    } else {
      console.log('❌ No themes found');
      success = false;
    }
    
  } catch (error) {
    console.log(`❌ Test failed with error: ${error.message}`);
    success = false;
  } finally {
    // Clean up test files and restore backup if needed
    if (fs.existsSync(gamifyDir)) {
      fs.rmSync(gamifyDir, { recursive: true, force: true });
      console.log('🧹 Cleaned up test installation');
    }
    
    // Restore original installation if it existed
    if (hadExistingInstall && fs.existsSync(backupDir)) {
      fs.renameSync(backupDir, gamifyDir);
      console.log('🔄 Restored original installation');
    }
  }
  
  console.log('\n📊 Initialization Test Results:');
  if (success) {
    console.log('✅ All initialization tests passed!');
    console.log('\n🎉 Claude Gamify NPX CLI is ready for use!');
  } else {
    console.log('❌ Some initialization tests failed');
    process.exit(1);
  }
}

testInitialization().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
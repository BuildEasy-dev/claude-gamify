#!/usr/bin/env node

/**
 * Claude Code Gamified Sound System
 * Multi-theme sound notification support
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

// Parse command line arguments
const hookName = process.argv[2];

// Path configuration
const homeDir = os.homedir();
const configFile = path.join(homeDir, '.claude-gamify', 'config.json');
const themesBase = path.join(homeDir, '.claude-gamify', 'themes');
const systemSounds = '/System/Library/Sounds';

// Platform detection
const isMacOS = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

// macOS system sound mappings (fallback when theme sounds not found)
const macOSSystemSounds = {
  SessionStart: 'Hero.aiff',
  UserPromptSubmit: 'Pop.aiff', 
  PreToolUse: 'Tink.aiff',
  PostToolUse: 'Glass.aiff',
  Notification: 'Ping.aiff',
  Stop: 'Funk.aiff',
  SubagentStop: 'Glass.aiff'
};

/**
 * Load configuration from JSON file
 */
function loadConfig() {
  const defaultConfig = {
    sound_theme: 'system',
    sound_enabled: true,
    sound_volume: 0.5
  };
  
  try {
    const jsonConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    return { ...defaultConfig, ...jsonConfig };
  } catch (error) {
    // Return defaults if config doesn't exist
    return defaultConfig;
  }
}

/**
 * Find sound file path (convention over configuration)
 */
function findSoundPath(hookName, currentTheme) {
  const extensions = ['.aiff', '.mp3', '.wav'];
  
  // Priority 1: Theme directory (by hook name)
  const themeDir = path.join(themesBase, currentTheme);
  if (fs.existsSync(themeDir)) {
    for (const ext of extensions) {
      const themePath = path.join(themeDir, hookName + ext);
      if (fs.existsSync(themePath)) {
        return themePath;
      }
    }
  }
  
  // Priority 2: Default theme directory (cross-platform fallback)
  const defaultDir = path.join(themesBase, 'default');
  if (fs.existsSync(defaultDir)) {
    for (const ext of extensions) {
      const defaultPath = path.join(defaultDir, hookName + ext);
      if (fs.existsSync(defaultPath)) {
        return defaultPath;
      }
    }
  }
  
  // Priority 3: macOS system sounds (macOS only)
  if (isMacOS) {
    const systemSoundFile = macOSSystemSounds[hookName];
    if (systemSoundFile) {
      const systemPath = path.join(systemSounds, systemSoundFile);
      if (fs.existsSync(systemPath)) {
        return systemPath;
      }
    }
  }
  
  return null;
}

/**
 * Get audio player command for current platform
 */
function getAudioPlayerCommand(soundPath, volume) {
  if (isMacOS) {
    // macOS: Use afplay
    return {
      command: 'afplay',
      args: ['-v', volume.toString(), soundPath]
    };
  } else if (isLinux) {
    // Linux: Try multiple players
    const players = [
      { command: 'paplay', args: ['--volume', Math.round(volume * 65536).toString(), soundPath] },
      { command: 'aplay', args: [soundPath] }, // No volume control
      { command: 'mpg123', args: ['-q', soundPath] },
      { command: 'play', args: ['-q', '-v', volume.toString(), soundPath] }
    ];
    
    // Return first available player
    for (const player of players) {
      try {
        require('child_process').execSync(`which ${player.command}`, { stdio: 'ignore' });
        return player;
      } catch (e) {
        continue;
      }
    }
  }
  
  return null;
}

/**
 * Play sound file
 */
function playSound(soundPath, volume) {
  if (!soundPath) return;
  
  const playerConfig = getAudioPlayerCommand(soundPath, volume);
  if (!playerConfig) {
    // Fail silently
    return;
  }
  
  try {
    // Spawn async to avoid blocking
    const player = spawn(playerConfig.command, playerConfig.args, {
      detached: true,
      stdio: 'ignore'
    });
    
    player.unref(); // Allow parent to exit
  } catch (error) {
    // Fail silently
  }
}

/**
 * Main entry point
 */
function main() {
  if (!hookName) {
    console.error('Usage: node play_sound.js <HookName>');
    process.exit(1);
  }
  
  const config = loadConfig();
  
  // Exit silently if sounds disabled
  if (!config.sound_enabled) {
    process.exit(0);
  }
  
  const soundPath = findSoundPath(hookName, config.sound_theme);
  
  if (soundPath) {
    playSound(soundPath, config.sound_volume);
  }
  
  // Exit immediately, don't block Claude Code
  process.exit(0);
}

// Run
main();
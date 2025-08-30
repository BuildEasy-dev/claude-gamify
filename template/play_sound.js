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

// Platform detection
const isMacOS = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

// Hook event name mapping
const HOOK_EVENT_MAPPING = {
  'SessionStart': 'session_start',
  'UserPromptSubmit': 'user_prompt_submit',
  'PreToolUse': 'pre_tool_use',
  'PostToolUse': 'post_tool_use',
  'Notification': 'notification',
  'Stop': 'stop',
  'SubagentStop': 'subagent_stop'
};

/**
 * Load configuration from JSON file
 */
function loadConfig() {
  const defaultConfig = {
    theme: 'system',
    sound_enabled: true,
    sound_volume: 0.5,
    sound_hooks: {
      session_start: true,
      user_prompt_submit: true,
      pre_tool_use: true,
      post_tool_use: true,
      notification: true,
      stop: true,
      subagent_stop: true
    }
  };
  
  try {
    const jsonConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    // Merge with defaults to handle missing sound_hooks
    const config = { ...defaultConfig, ...jsonConfig };
    if (jsonConfig.sound_hooks) {
      config.sound_hooks = { ...defaultConfig.sound_hooks, ...jsonConfig.sound_hooks };
    }
    return config;
  } catch (error) {
    // Return defaults if config doesn't exist
    return defaultConfig;
  }
}

/**
 * Check if sound should play for this hook
 */
function shouldPlaySound(hookName, config) {
  // Check global enabled state
  if (!config.sound_enabled) return false;
  
  // Check volume
  if (config.sound_volume <= 0) return false;
  
  // Check individual hook state
  const configKey = HOOK_EVENT_MAPPING[hookName] || hookName.toLowerCase();
  if (config.sound_hooks && configKey in config.sound_hooks) {
    return config.sound_hooks[configKey];
  }
  
  return true; // Default to enabled
}

/**
 * Find sound file path (convention over configuration)
 */
function findSoundPath(hookName, currentTheme) {
  const extensions = ['.aiff', '.mp3', '.wav'];
  
  // Only look in the current theme directory - no fallbacks
  const themeDir = path.join(themesBase, currentTheme);
  if (fs.existsSync(themeDir)) {
    for (const ext of extensions) {
      const themePath = path.join(themeDir, hookName + ext);
      if (fs.existsSync(themePath)) {
        return themePath;
      }
    }
  }
  
  // No sound found - return null (fail silently)
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
  
  // Check if sound should play for this specific hook
  if (!shouldPlaySound(hookName, config)) {
    process.exit(0);
  }
  
  const soundPath = findSoundPath(hookName, config.theme);
  
  if (soundPath) {
    playSound(soundPath, config.sound_volume);
  }
  
  // Exit immediately, don't block Claude Code
  process.exit(0);
}

// Run
main();
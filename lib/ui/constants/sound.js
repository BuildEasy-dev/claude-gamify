/**
 * Sound System Configuration
 * Contains all sound-related settings and UI configurations
 */

// Hook Names (for sound testing)
export const HOOK_NAMES = [
  'SessionStart',
  'UserPromptSubmit',
  'PreToolUse',
  'PostToolUse',
  'Notification',
  'Stop',
  'SubagentStop'
];

// Sound Configuration UI
export const SOUND_CONFIG_UI = {
  // Display names for hooks
  HOOK_DISPLAY_NAMES: {
    'SessionStart': 'Session Start',
    'UserPromptSubmit': 'User Prompt Submit',
    'PreToolUse': 'Pre Tool Use',
    'PostToolUse': 'Post Tool Use',
    'Notification': 'Notification',
    'Stop': 'Stop',
    'SubagentStop': 'Subagent Stop'
  },
  
  // Keyboard shortcuts
  SHORTCUTS: {
    TOGGLE: 'space',
    SAVE: 's',
    CANCEL: 'escape',
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right',
    ALL: 'a',
    NONE: 'n',
    INVERT: 'i',
    RESET: 'r',
    EDIT: 'return'
  },
  
  // Control bar display
  CONTROL_HINTS: [
    '[↑/↓] Navigate',
    '[Space] Toggle',
    '[←/→] Volume',
    '[A]ll',
    '[N]one',
    '[I]nvert',
    '[R]eset',
    '[S]ave',
    '[ESC] Cancel'
  ],
  
  // Section headers
  HEADERS: {
    GLOBAL: 'Global Settings',
    HOOKS: 'Individual Hook Controls'
  },
  
  // Status indicators
  STATUS: {
    ENABLED: '✓ Enabled',
    DISABLED: '✗ Disabled'
  }
};

// Test Sounds Interactive UI
export const TEST_SOUNDS_UI = {
  // Keyboard shortcuts for interactive test sounds
  SHORTCUTS: {
    PLAY: 'return',
    UP: 'up', 
    DOWN: 'down',
    ALL: 'a',
    BACK: 'escape'
  },
  
  // Control hints for test sounds
  CONTROL_HINTS: [
    '[↑/↓] Navigate',
    '[Enter] Play',
    '[A] Play All',
    '[ESC] Back'
  ],
  
  // Status indicators
  STATUS_ICONS: {
    ENABLED: '✓',
    DISABLED: '✗',
    MUTED: '🔇',
    PLAYING: '♪',
    READY: '●'
  }
};
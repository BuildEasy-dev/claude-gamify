# Sound Configuration Enhancement - Technical Design

## Overview
Enhancement to claude-gamify CLI to add unified sound configuration with individual hook controls.

## Feature Requirements

### Functional Requirements
1. Unified menu combining global settings and individual hook controls
2. Global master switch for all sounds
3. Master volume control (0-100%)
4. Individual on/off toggle for each hook event
5. Batch operations (enable all, disable all, invert, reset)
6. Save/cancel with confirmation for unsaved changes

### UI Requirements
- Single unified configuration screen
- Clear visual hierarchy between global and hook settings
- Keyboard navigation with arrow keys
- Quick action shortcuts at bottom
- Real-time visual feedback for selections

## Technical Design

### 1. Data Model

#### Configuration Structure
```javascript
// ~/.claude-gamify/config.json
{
  "sound_enable": true,         // Global master switch (existing)
  "sound_volume": 0.5,          // Master volume 0.0-1.0 (existing)
  "theme": "zelda",             // Current theme (existing)
  "sound_hooks": {              // NEW: Individual hook controls
    "session_start": true,
    "user_prompt_submit": true,
    "pre_tool_use": false,
    "post_tool_use": true,
    "notification": true,
    "stop": false,
    "subagent_stop": true
  }
}
```

#### Hook Event Mapping
```javascript
// Mapping between Claude's PascalCase events and snake_case config keys
const HOOK_EVENT_MAPPING = {
  'SessionStart': 'session_start',
  'UserPromptSubmit': 'user_prompt_submit',
  'PreToolUse': 'pre_tool_use',
  'PostToolUse': 'post_tool_use',
  'Notification': 'notification',
  'Stop': 'stop',
  'SubagentStop': 'subagent_stop'
};

// Reverse mapping for convenience
const CONFIG_TO_EVENT = Object.entries(HOOK_EVENT_MAPPING)
  .reduce((acc, [event, config]) => {
    acc[config] = event;
    return acc;
  }, {});

// Default hook events (Claude's format)
const DEFAULT_HOOKS = Object.keys(HOOK_EVENT_MAPPING);

// Default config keys (snake_case format)
const DEFAULT_HOOK_CONFIGS = Object.values(HOOK_EVENT_MAPPING);
```

### 2. Module Architecture

#### Core Layer (lib/core/)

**config.js** - Configuration Management Extensions
```javascript
class ConfigManager {
  // Existing methods...
  
  // Convert between Claude event names and config keys
  eventToConfigKey(eventName) {
    return HOOK_EVENT_MAPPING[eventName] || eventName.toLowerCase().replace(/([A-Z])/g, '_$1').toLowerCase();
  }
  
  configKeyToEvent(configKey) {
    return CONFIG_TO_EVENT[configKey] || configKey;
  }
  
  // New methods for hook state management
  getHookState(eventName) {
    const config = await this.load();
    const configKey = this.eventToConfigKey(eventName);
    
    if (config.sound_hooks && configKey in config.sound_hooks) {
      return config.sound_hooks[configKey];
    }
    return true; // Default to enabled
  }
  
  setHookState(eventName, enabled) {
    const config = await this.load();
    const configKey = this.eventToConfigKey(eventName);
    
    if (!config.sound_hooks) {
      config.sound_hooks = {};
    }
    config.sound_hooks[configKey] = enabled;
    await this.save(config);
  }
  
  setAllHookStates(enabled) {}
  invertHookStates() {}
  getActiveHooksCount() {}
  resetHookStates() {}
  migrateConfig(config) {}  // Handle old configs without sound_hooks
}
```

**player.js** - Playback Logic Updates
```javascript
class PlayerManager {
  shouldPlaySound(eventName) {
    // Check hierarchy:
    // 1. Global enabled state
    // 2. Individual hook state (if exists)
    // 3. Volume > 0
    const config = await this.configManager.load();
    
    if (!config.sound_enable) return false;
    if (config.sound_volume <= 0) return false;
    
    // Check individual hook state
    const hookState = await this.configManager.getHookState(eventName);
    return hookState;
  }
}
```

#### CLI Layer (lib/cli/)

**menus.js** - Unified Configuration Menu
```javascript
class MenuManager {
  async configureSoundsMenu() {
    const state = new SoundConfigState(await this.configManager.load());
    
    while (true) {
      // Render current state
      this.renderSoundConfig(state);
      
      // Handle input
      const action = await this.handleSoundConfigInput(state);
      
      if (action === 'save') {
        await this.saveSoundConfig(state);
        break;
      } else if (action === 'cancel') {
        if (await this.confirmCancel(state)) break;
      }
      // Other actions update state and continue loop
    }
  }
}
```

#### UI Layer (lib/ui/)

**components.js** - Display Components
```javascript
function renderSoundConfigScreen(state) {
  // Clear screen
  console.clear();
  
  // Title
  console.log(chalk.bold('Sound Configuration'));
  console.log('═'.repeat(40));
  
  // Global settings section
  renderGlobalSettings(state);
  
  // Hook controls section
  renderHookControls(state);
  
  // Control bar
  renderControlBar(state);
}

function renderGlobalSettings(state) {
  const { sound_enable, sound_volume, cursorPosition } = state;
  
  console.log('\nGlobal Settings:');
  
  // Highlight if selected
  const soundSystemLine = `  > Sound System      [ ${sound_enable ? 'Enabled' : 'Disabled'} ]`;
  const volumeLine = `  > Master Volume     [ ${Math.round(sound_volume * 100)}% ]`;
  
  // Apply highlighting based on cursor
  // ...
}

function renderHookControls(state) {
  console.log('\nIndividual Hook Controls:');
  
  DEFAULT_HOOK_CONFIGS.forEach((hookConfig, index) => {
    const eventName = CONFIG_TO_EVENT[hookConfig];
    const displayName = eventName.replace(/([A-Z])/g, ' $1').trim();
    const status = state.sound_hooks[hookConfig] ? 'Enabled' : 'Disabled';
    const prefix = state.cursorPosition === index + 2 ? '  > ' : '    ';
    const line = `${prefix}${displayName.padEnd(20, '.')}[ ${status} ]`;
    
    // Dim if global is disabled
    if (!state.sound_enable) {
      console.log(chalk.dim(line));
    } else {
      console.log(line);
    }
  });
}
```

**prompts.js** - Custom Navigation Handler
```javascript
async function soundConfigNavigator() {
  return new Promise((resolve) => {
    const keypress = require('keypress');
    keypress(process.stdin);
    
    process.stdin.on('keypress', (ch, key) => {
      if (key) {
        switch(key.name) {
          case 'up':    resolve({ action: 'navigate', direction: 'up' }); break;
          case 'down':  resolve({ action: 'navigate', direction: 'down' }); break;
          case 'left':  resolve({ action: 'adjust', direction: 'decrease' }); break;
          case 'right': resolve({ action: 'adjust', direction: 'increase' }); break;
          case 'space': resolve({ action: 'toggle' }); break;
          case 'a':     resolve({ action: 'all' }); break;
          case 'n':     resolve({ action: 'none' }); break;
          case 'i':     resolve({ action: 'invert' }); break;
          case 'r':     resolve({ action: 'reset' }); break;
          case 's':     resolve({ action: 'save' }); break;
          case 'escape': resolve({ action: 'cancel' }); break;
          case 'return': resolve({ action: 'edit' }); break;
        }
      }
    });
    
    process.stdin.setRawMode(true);
    process.stdin.resume();
  });
}
```

### 3. State Management

```javascript
class SoundConfigState {
  constructor(config) {
    this.sound_enable = config.sound_enable;
    this.sound_volume = config.sound_volume;
    this.sound_hooks = {...(config.sound_hooks || {})};
    this.originalConfig = {...config};
    
    this.cursorPosition = 0;  // 0-1 for global, 2+ for hooks
    this.maxPosition = 1 + DEFAULT_HOOK_CONFIGS.length;
    this.isDirty = false;
  }
  
  navigate(direction) {
    if (direction === 'up') {
      this.cursorPosition = Math.max(0, this.cursorPosition - 1);
    } else {
      this.cursorPosition = Math.min(this.maxPosition, this.cursorPosition + 1);
    }
  }
  
  toggleCurrent() {
    if (this.cursorPosition === 0) {
      this.sound_enable = !this.sound_enable;
    } else if (this.cursorPosition >= 2) {
      const hookIndex = this.cursorPosition - 2;
      const hookConfig = DEFAULT_HOOK_CONFIGS[hookIndex];
      this.sound_hooks[hookConfig] = !this.sound_hooks[hookConfig];
    }
    this.isDirty = true;
  }
  
  adjustVolume(direction) {
    if (this.cursorPosition === 1) {
      const step = 0.05;
      if (direction === 'increase') {
        this.sound_volume = Math.min(1.0, this.sound_volume + step);
      } else {
        this.sound_volume = Math.max(0.0, this.sound_volume - step);
      }
      this.isDirty = true;
    }
  }
  
  hasChanges() {
    return this.isDirty;
  }
  
  toConfig() {
    return {
      sound_enable: this.sound_enable,
      sound_volume: this.sound_volume,
      sound_hooks: this.sound_hooks,
      theme: this.originalConfig.theme
    };
  }
}
```

### 4. Template Updates

**template/play_sound.js** - Hook State Checking
```javascript
// Mapping for event name conversion
const HOOK_EVENT_MAPPING = {
  'SessionStart': 'session_start',
  'UserPromptSubmit': 'user_prompt_submit',
  'PreToolUse': 'pre_tool_use',
  'PostToolUse': 'post_tool_use',
  'Notification': 'notification',
  'Stop': 'stop',
  'SubagentStop': 'subagent_stop'
};

async function shouldPlay(eventType) {
  try {
    const configPath = path.join(baseDir, 'config.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
    
    // Check global enabled
    if (!config.sound_enable) return false;
    
    // Check volume
    if (config.sound_volume <= 0) return false;
    
    // Check individual hook state
    const configKey = HOOK_EVENT_MAPPING[eventType] || eventType.toLowerCase();
    if (config.sound_hooks && configKey in config.sound_hooks) {
      return config.sound_hooks[configKey];
    }
    
    return true; // Default to enabled
  } catch (err) {
    return false;
  }
}
```

### 5. Migration Strategy

```javascript
function migrateConfig(config) {
  // Add sound_hooks if missing
  if (!config.sound_hooks) {
    config.sound_hooks = {};
    DEFAULT_HOOK_CONFIGS.forEach(hookConfig => {
      config.sound_hooks[hookConfig] = true;  // Default all to enabled
    });
  }
  
  // Ensure all default hooks exist
  DEFAULT_HOOK_CONFIGS.forEach(hookConfig => {
    if (!(hookConfig in config.sound_hooks)) {
      config.sound_hooks[hookConfig] = true;
    }
  });
  
  // Migrate from old field names if they exist
  if ('enabled' in config && !('sound_enable' in config)) {
    config.sound_enable = config.enabled;
    delete config.enabled;
  }
  if ('volume' in config && !('sound_volume' in config)) {
    config.sound_volume = config.volume;
    delete config.volume;
  }
  
  return config;
}
```

### 6. File Change Summary

```
Files to Modify:
├── lib/
│   ├── core/
│   │   ├── config.js         [Add hook state methods, migration]
│   │   └── player.js         [Update shouldPlaySound logic]
│   ├── cli/
│   │   └── menus.js          [Replace sound config menu]
│   ├── ui/
│   │   ├── components.js     [Add config screen components]
│   │   ├── prompts.js        [Add custom navigator]
│   │   └── constants.js      [Add UI constants for config]
│   └── orchestrator.js       [Wire up new menu]
├── template/
│   ├── play_sound.js         [Check individual hook states]
│   └── config.json           [Add default sound_hooks]
└── test/
    └── test-basic.js         [Add hook state tests]
```

## Implementation Plan

### Phase 1: Data Layer (Core)
1. Update config.js with hook state methods
2. Add migration logic for existing configs
3. Update default config template
4. Test migration and state management

### Phase 2: Playback Logic
1. Modify template/play_sound.js to check hook states
2. Update player.js shouldPlaySound method
3. Test playback with various state combinations

### Phase 3: UI Components
1. Create state management class
2. Build display components
3. Implement custom navigation handler
4. Create visual feedback system

### Phase 4: Integration
1. Wire up new menu to orchestrator
2. Replace old sound configuration menu
3. Update command handlers
4. Full integration testing

### Phase 5: Testing & Polish
1. Test all keyboard shortcuts
2. Test edge cases (all disabled, migration, etc.)
3. Add proper error handling
4. Update documentation

## Testing Checklist

### Unit Tests
- [ ] Config migration from old format
- [ ] Hook state getters/setters
- [ ] State management class
- [ ] Navigation boundaries
- [ ] Volume adjustment limits

### Integration Tests
- [ ] Full menu flow (open, edit, save)
- [ ] Cancel with/without changes
- [ ] Batch operations (all, none, invert)
- [ ] Global vs individual state interaction
- [ ] Config file persistence

### Manual Testing
- [ ] All keyboard navigation
- [ ] Visual feedback correctness
- [ ] Hook playback respects settings
- [ ] Backward compatibility
- [ ] Error scenarios

## Risk Assessment

### Technical Risks
1. **Complex Navigation**: Mixing navigation and value adjustment
   - Mitigation: Clear visual cues and help text

2. **State Synchronization**: Keeping UI and config in sync
   - Mitigation: Single source of truth in state class

3. **Backward Compatibility**: Existing configs without sound_hooks
   - Mitigation: Automatic migration on load, including field name migrations

4. **Zero-dependency Constraint**: play_sound.js must stay lightweight
   - Mitigation: Simple object property checks only

## Success Criteria

1. Users can control each hook independently
2. Global toggle overrides individual settings visually
3. Volume adjustment is smooth and intuitive
4. All changes can be saved or cancelled
5. Existing configurations migrate seamlessly
6. No performance degradation
7. Maintains zero-dependency player

## Timeline Estimate

- Phase 1: 2 hours (Data Layer)
- Phase 2: 1 hour (Playback Logic)
- Phase 3: 3 hours (UI Implementation)
- Phase 4: 2 hours (Integration)
- Phase 5: 2 hours (Testing & Polish)

**Total: ~10 hours of development**
# Claude Code Gamified Sound System

Gamified sound notifications for Claude Code. Transform your coding sessions into an immersive experience with themed sound effects.

## Features

- 🎮 **Multi-theme support** - Choose from various game-inspired themes
- 🔊 **Cross-platform** - Works on macOS and Linux
- ⚡ **Zero dependencies** - Pure Node.js implementation
- 🎯 **Convention over configuration** - Just drop sound files and go
- 🔧 **Flexible configuration** - JSON-based settings

## Quick Start

Sound effects are already configured in your Claude Code hooks. To customize:

1. **Change theme**: Edit `config.json`

   ```json
   {
     "sound_theme": "zelda",
     "sound_enabled": true,
     "sound_volume": 0.5
   }
   ```

2. **Available themes**:
   - `system` - Clean professional sounds (uses macOS system sounds)
   - `zelda` - Epic adventure theme

3. **Toggle sounds**: Set `"sound_enabled": false` to mute

## Directory Structure

```
~/.claude-code-gamify/
├── play_sound.js       # Main sound player
├── config.json         # User configuration
└── themes/             # Theme directories
    ├── default/        # Cross-platform fallback sounds
    ├── zelda/          # Zelda theme sounds
```

## Adding Custom Themes

1. Create a new directory in `themes/`
2. Add sound files matching hook names:
   - `SessionStart.*`
   - `UserPromptSubmit.*`
   - `PreToolUse.*`
   - `PostToolUse.*`
   - `Notification.*`
   - `Stop.*`
   - `SubagentStop.*`
3. Set theme in `config.json`: `"sound_theme": "your-theme"`

Supported formats: `.wav`, `.mp3`, `.aiff`

## Hook Events

| Event                | Trigger                | Purpose                     |
| -------------------- | ---------------------- | --------------------------- |
| **SessionStart**     | Claude Code starts     | Begin your coding adventure |
| **UserPromptSubmit** | Send message to Claude | Issue a command             |
| **PreToolUse**       | Before tool execution  | Prepare for action          |
| **PostToolUse**      | After tool execution   | Task complete               |
| **Notification**     | System notifications   | Important alerts            |
| **Stop**             | Session ends           | Adventure complete          |
| **SubagentStop**     | Subtask complete       | Milestone reached           |

## Configuration

Edit `config.json`:

```json
{
  "sound_theme": "zelda", // Theme name
  "sound_enabled": true, // Enable/disable sounds
  "sound_volume": 0.5 // Volume (0.0 - 1.0)
}
```

## Platform Support

- **macOS**: Uses `afplay` (built-in)
- **Linux**: Auto-detects available player:
  - `paplay` (PulseAudio)
  - `aplay` (ALSA)
  - `mpg123` (MP3 player)
  - `play` (SoX)

## Troubleshooting

- **No sound?** Check `sound_enabled` in config
- **Wrong theme?** Verify theme name in config
- **Linux no sound?** Install one of the supported players

## License

MIT


# Claude Gamify 🎮

**Interactive NPX CLI for managing Claude Code gamification system**

Transform your Claude Code experience with immersive sound effects and themes. Claude Gamify provides a beautiful, interactive command-line interface to manage your sound system, install themes, and configure settings.

## ✨ Features

- 🎵 **Theme Management** - Switch between different sound themes (Zelda, etc.)
- ⚙️ **Settings Control** - Adjust volume, toggle sounds on/off
- 🔊 **Sound Testing** - Test individual sounds or complete theme sets
- 📊 **System Info** - View configuration and system compatibility
- 🚀 **One-Click Setup** - Automatic initialization and Claude Code integration
- 🎨 **Beautiful Interface** - Modern CLI with colors, progress bars, and intuitive menus

## 🚀 Quick Start

### Installation & Setup

```bash
# One-command installation and setup
npx claude-gamify

# Follow the interactive setup wizard
```

### Daily Usage

```bash
# Open the interactive manager
npx claude-gamify

# Quick commands
npx claude-gamify init      # Reinitialize system
npx claude-gamify status    # Show current status
```

## 🎵 Available Themes

- **Zelda** - The Legend of Zelda-inspired sound effects (default)
- **Portal** - Portal game-inspired sounds and interface
- **StarCraft** - StarCraft game-inspired audio experience
- **Default** - Clean, minimal system sounds template
- More themes coming soon!

## 📋 Requirements

- **Node.js** 14.0.0 or higher
- **Claude Code** with hooks support
- **Audio System**:
  - **macOS**: Built-in (uses `afplay`)
  - **Linux**: PulseAudio, ALSA, or SoX

## 🔧 How It Works

Claude Gamify uses a **separated architecture**:

1. **NPX CLI Tool** (`claude-gamify`) - Rich interactive interface for management
2. **Local Sound Player** (`~/.claude-gamify/play_sound.js`) - Zero-dependency, fast audio player
3. **Claude Code Hooks** - Integration with Claude Code's event system

```
┌─────────────────────┐
│   npx claude-gamify │  ← Interactive management
└─────────┬───────────┘
          │ deploys
          ↓
┌─────────────────────┐
│  ~/.claude-gamify/  │  ← Local sound system
│  • play_sound.js   │
│  • config.json     │
│  • themes/         │
└─────────┬───────────┘
          │ hooks
          ↓
┌─────────────────────┐
│    Claude Code      │
└─────────────────────┘
```

## 🎛️ Configuration

Configuration is stored in `~/.claude-gamify/config.json`:

```json
{
  "theme": "zelda",
  "sound_enabled": true,
  "sound_volume": 0.5
}
```

## 🎯 Supported Sound Events

- **SessionStart** - When Claude Code starts
- **UserPromptSubmit** - When you send a message
- **PreToolUse** - Before Claude uses a tool
- **PostToolUse** - After Claude uses a tool
- **Notification** - General notifications
- **Stop** - When Claude finishes responding
- **SubagentStop** - When a subtask completes

## 🛠️ Advanced Usage

### Manual Theme Installation

```bash
# Copy theme files to ~/.claude-gamify/themes/my-theme/
# Include: SessionStart.wav, UserPromptSubmit.wav, etc.
npx claude-gamify  # Select theme in UI
```

### Troubleshooting

```bash
# Check system compatibility
npx claude-gamify
# → System Info

# Reinitialize if needed
npx claude-gamify init

# Test specific sounds
npx claude-gamify
# → Test Sounds
```

## 🔊 Linux Audio Setup

If you're on Linux and sounds aren't working, install audio players:

```bash
# Ubuntu/Debian
sudo apt install alsa-utils pulseaudio-utils mpg123 sox

# CentOS/RHEL/Fedora
sudo yum install alsa-utils pulseaudio-utils mpg123 sox

# Arch Linux
sudo pacman -S alsa-utils pulseaudio mpg123 sox
```

## 📁 Project Structure

```
claude-gamify/
├── package.json           # NPX package configuration
├── bin/cli.js            # CLI entry point
├── lib/claude-sound.js   # Core manager class
├── template/             # Deployment templates
│   ├── play_sound.js     # Zero-dependency player
│   ├── config.json       # Default configuration
│   └── themes/           # Sound themes
│       ├── default/
│       └── zelda/
└── test/                 # Tests
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Credits

- Sound effects inspired by classic video games
- Built for the Claude Code community
- Powered by Node.js and modern CLI tools

---

**Happy Coding with Claude Gamify!** 🎮✨


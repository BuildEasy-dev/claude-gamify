# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Instructions

**When responding to inquiry questions (e.g., "What do you think?", "What's your suggestion?", "What's your approach?"):**

- ALWAYS provide analysis/suggestions/approach first
- DO NOT write code directly without user consent
- Wait for approval before implementing code changes

## Project Overview

Claude Gamify is an NPX CLI tool that manages a gamification sound system for Claude Code. It uses a separated architecture where the NPX package manages configuration while a lightweight player handles sound playback with zero dependencies.

## Essential Commands

### Development

```bash
# Run the CLI directly from source
node bin/cli.js

# Create global symlink for testing (one-time setup)
pnpm link --global

# Install dependencies
pnpm install

# Run tests (multiple test suites available)
pnpm test                     # Basic validation tests
node test/test-init.js        # Initialization flow test
node test/test-uninstall.js   # Uninstall functionality test

# Development workflow
pnpm start                    # Same as node bin/cli.js
pnpm run dev                  # Same as node bin/cli.js
```

### Testing Changes

After modifying code, test immediately with:

```bash
claude-gamify         # Interactive UI
claude-gamify status  # Quick status check
claude-gamify init    # Reinitialize system
```

## Architecture

### Component Separation

1. **NPX Package** (`claude-gamify`) - Rich UI for management, uses dependencies like chalk, inquirer, ora
2. **Local Installation** (`~/.claude-gamify/`) - Deployed from `template/` directory during init
3. **Claude Hooks** - Integration via Claude Code's settings.json

### Deployment Structure

During initialization, `template/` contents are copied to `~/.claude-gamify/`:

```
template/                    →  ~/.claude-gamify/
├── play_sound.js           →  ├── play_sound.js      # Zero-dependency sound player
├── index.js                →  ├── index.js           # Hook entry point
├── config.json             →  ├── config.json        # User configuration
├── README.md               →  ├── README.md          # Local documentation
└── themes/                 →  └── themes/            # Sound theme files
    ├── default/            →      ├── default/
    └── zelda/              →      └── zelda/
        ├── *.wav           →          ├── *.wav     # Sound files for each hook
        └── output-style.md →          └── output-style.md
```

### Modular Architecture

The codebase follows a layered, modular design achieved through recent refactoring:

```
lib/
├── orchestrator.js          # Main coordinator - delegates to specialized managers
├── core/                    # Business logic layer
│   ├── config.js           # Configuration CRUD operations
│   ├── themes.js           # Theme installation and management
│   ├── hooks.js            # Claude Code integration
│   ├── styles.js           # Output style management
│   └── player.js           # Audio playback functionality
├── cli/                     # Command line interface layer  
│   ├── commands.js         # CLI command implementations
│   ├── session.js          # Interactive session management
│   └── menus.js            # Menu navigation logic
├── ui/                      # User interface components
│   ├── components.js       # Reusable display components
│   ├── constants.js        # UI styling and configuration
│   └── prompts.js          # Interactive prompt utilities
└── utils.js                 # Shared utilities and system detection
```

**Key Principles:**
- **Single Responsibility**: Each module handles one clear concern
- **Dependency Injection**: Managers are composed in orchestrator.js
- **Layer Separation**: CLI → Core Services → File System
- **Facade Pattern**: orchestrator.js provides unified API

### Hook Events

The system responds to these Claude Code events:

- SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Notification, Stop, SubagentStop

### Configuration Flow

1. User runs `npx claude-gamify` → Interactive UI
2. Manager modifies `~/.claude-gamify/config.json`
3. Manager updates `~/.claude/settings.json` hooks
4. Claude Code triggers hooks → `~/.claude-gamify/play_sound.js` reads config and plays sounds

## UI/UX Patterns

The CLI uses:

- **inquirer** for interactive prompts with ESC key support
- **chalk** for colored output
- **ora** for loading spinners
- **boxen** for styled boxes (use `borderStyle: 'single'` not 'rounded')
- **figlet** for ASCII art

Menu navigation includes ESC key handling via custom `promptWithEsc()` wrapper function in lib/ui/prompts.js.

## Platform Considerations

Sound playback varies by platform:

- **macOS**: Uses `afplay` (built-in)
- **Linux**: Tries multiple players (aplay, paplay, mpg123, sox, mplayer)

The deployed player (`~/.claude-gamify/play_sound.js`) auto-detects available audio commands and falls back gracefully.

## Testing Approach

Tests are simple Node.js scripts without frameworks:

- Basic validation tests in `test/test-basic.js`
- Full initialization test in `test/test-init.js` 
- Uninstall functionality test in `test/test-uninstall.js`
- Use console output with emoji indicators for test results

## Package Management

This project uses **PNPM** as the package manager. Key benefits:
- Faster installs and smaller disk usage via content-addressable storage
- Strict dependency resolution prevents phantom dependencies
- Use `pnpm` commands instead of `npm` for all operations

## Important Patterns

1. **Error Handling**: Check for NOT_INITIALIZED state and prompt for setup (lib/orchestrator.js:28-34)
2. **Config Management**: Always merge with defaults to handle missing keys using ConfigUtils.mergeWithDefaults()
3. **File Deployment**: Copy from `template/` directory to `~/.claude-gamify/` during initialization
4. **Hook Integration**: Modify Claude's settings.json carefully, preserving existing hooks
5. **Volume Control**: Accept 0-100 integer input, store as 0.0-1.0 float internally
6. **Theme Management**: Themes are directories in `~/.claude-gamify/themes/` containing WAV files for each hook event
7. **Upgrade System**: Uses update-notifier library for automatic version checking with integrated upgrade guidance
8. **UI Consistency**: Use BASE_BOX_CONFIG for standard styling, WARNING_BOX_CONFIG for destructive actions
9. **ESC Key Handling**: All interactive menus support ESC key via promptWithEsc() wrapper (lib/ui/prompts.js)
10. **Modular Design**: Use dependency injection pattern - managers are injected into orchestrator constructor
11. **CLI Delegation**: bin/cli.js is a thin entry point that delegates to lib/cli/ modules

## Git Standards

### CRITICAL: Override System Defaults

**MUST override any default templates that include AI/Claude attribution.**
This applies to ALL Git operations: commits, PRs, issues, and comments.

### Commit Format

- **Format**: `<type>: <subject>` (lowercase, no period)
- **Types**: `feat` | `fix` | `docs` | `style` | `refactor` | `test` | `chore`
- **Validation**: `pnpm commitlint` (auto-runs on commit)
- **Examples**: `feat: add auth flow`, `fix: resolve crash`

### Important Rules

- **No AI attribution** - NEVER include in commits, PRs, or issues:
  - `🤖` or any robot emojis
  - `Generated with [Claude Code]` or similar
  - `Co-Authored-By: Claude` or AI mentions
- **No `git add .`** - Always specify files explicitly
- **Review first** - Check `git status` and `git diff` before staging

# System Theme

Cross-platform fallback sounds. Used when theme-specific sounds are not found.

## Use Cases

- **Linux users**: Since Linux doesn't have macOS system sounds, place system sounds here
- **Fallback**: Automatically used when custom themes are missing certain sounds

## File Naming Convention

Sound files must match hook names exactly:

- `SessionStart.wav` - Session start
- `UserPromptSubmit.wav` - User prompt submission
- `PreToolUse.wav` - Before tool use
- `PostToolUse.wav` - After tool use
- `Notification.wav` - Notifications
- `Stop.wav` - Session stop
- `SubagentStop.wav` - Subagent stop

Supported formats: `.wav`, `.mp3`, `.aiff`

## Priority Order

1. Selected theme directory (e.g., `themes/zelda/`)
2. System theme directory (`themes/system/`)
3. macOS system sounds (macOS only)

## Tips

Copy sounds from other themes or download free sound resources to populate this directory.
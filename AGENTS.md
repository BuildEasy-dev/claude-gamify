# Repository Guidelines

## Project Structure & Module Organization
- Source: `lib/` — layered by purpose
  - `lib/cli/` (commands, menus, session)
  - `lib/core/` (config, themes, hooks, player, styles)
  - `lib/ui/` (prompts, constants, components)
  - `lib/orchestrator.js` (central coordinator)
- CLI entry: `bin/cli.js` (published as `claude-gamify`)
- Templates deployed to user: `template/` (player, config, themes)
- Tests: `test/` (`test-*.js` scripts)
- Docs: `docs/` (local dev, redesign, UI/UX)

## Build, Test, and Development Commands
- Run CLI locally: `node bin/cli.js` (interactive UI)
- Common commands: `node bin/cli.js status` · `node bin/cli.js init`
- Link for global dev: `npm link` then run `claude-gamify`
- Run tests: `node test/test-basic.js` · `node test/test-init.js` · others in `test/`
- Pack and inspect: `npm pack --dry-run` (verify published files)

## Coding Style & Naming Conventions
- Language: Node.js ES modules (`type: module`), Node >= 16
- Indentation: 2 spaces; include semicolons; prefer small, pure functions
- Filenames: kebab-case in `lib/ui/components/`; lower-case in `lib/core/` and `lib/cli/`
- Identifiers: PascalCase for classes (e.g., `ClaudeSound`), camelCase for functions/variables
- Imports/exports: named exports when possible; keep modules focused

## Testing Guidelines
- Framework: lightweight Node scripts (no Jest). Place tests in `test/` as `test-*.js`
- Run with `node <file>`; ensure tests do not leave state. Back up/restore `~/.claude-gamify` if writing
- Prefer unit-style checks for core logic; add integration tests for init, status, and sound hooks

## Commit & Pull Request Guidelines
- Commits: follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`). Keep messages imperative and scoped
- PRs: include a clear description, linked issue (if any), and CLI screenshots/gifs for UI changes. Note breaking changes
- Scope PRs narrowly; update docs/tests alongside code

## Security & Configuration Tips
- Never hardcode absolute paths; use `Paths` from `lib/utils.js`
- File writes occur under `~/.claude-gamify` and `~/.claude/`; validate existence and permissions
- Audio execution uses system players; avoid adding new shell execs beyond existing detection

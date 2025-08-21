---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(gh pr create:*), Bash(git log:*), Bash(gh pr list:*)
description: Create a github pull request
---

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`
- Check for existing PR: !`gh pr list --head main --json number`

## Task

1. **Commit** (if changes exist): Preview files to be committed, then create commit
2. **Push** (if needed): Show commits to be pushed, then push to remote
3. **Create PR** (if none exists): Show PR preview, then create pull request

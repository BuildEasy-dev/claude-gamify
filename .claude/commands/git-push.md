---
allowed-tools: Bash(git push:*), Bash(git status:*), Bash(git log:*)
description: Push local commits to remote repository
---

## Context

- Current git status: !`git status`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -5`
- Remote tracking: !`git status -b --porcelain`

## Your task

Push the current branch's commits to the remote repository. Verify the push was successful and provide feedback on the operation.

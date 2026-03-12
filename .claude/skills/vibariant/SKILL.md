---
name: vibariant
description: Manage A/B testing experiments with the Vibariant CLI. Use when creating experiments, checking results, generating SDK code, or managing the A/B testing workflow.
user_invocable: true
allowed-tools: Bash, Read, Grep
---

# Vibariant CLI — A/B Testing for Vibecoded Apps

All commands support `--json` (structured output) and `--yes` (skip prompts).

## JSON Contract

```json
{ "ok": true, "data": { ... } }
{ "ok": false, "error": "..." }
```
Exit codes: `0` success, `1` error, `2` not authenticated, `3` not found.

## Quick Reference

| Task | Command |
|------|---------|
| Check auth | `vibariant auth status --json` |
| List projects | `vibariant projects list --json` |
| Create project | `vibariant projects create "Name" --json` |
| List experiments | `vibariant experiments list --json` |
| Create experiment | `vibariant experiments create --key <key> --variants control,variant --json` |
| Show experiment + stats | `vibariant experiments show <id-or-key> --json` |
| Update experiment | `vibariant experiments update <id> --status running --json` |
| Get results | `vibariant experiments results <id> --json` |
| Generate SDK code | `vibariant codegen --framework next --json` |
| Full setup | `vibariant init --yes --email <email> --project-name "Name"` |
| Status overview | `vibariant status --json` |

## Detailed References

Read these when you need full flag details, response shapes, or examples:

- [auth.md](auth.md) — Login, logout, status, token auth
- [experiments.md](experiments.md) — CRUD, results, stats interpretation, decision statuses
- [projects.md](projects.md) — Project management
- [codegen.md](codegen.md) — SDK code generation, framework options, SDK integration patterns
- [goals.md](goals.md) — Goal detection and confirmation
- [workflows.md](workflows.md) — End-to-end workflow sequences, error handling, agent tips

# Authentication Commands

## `vibariant auth login`

Authenticate via device-code magic link or direct JWT.

```bash
# Interactive (prompts for email, sends magic link)
vibariant auth login

# Non-interactive with email
vibariant auth login --email user@example.com --json

# Direct JWT token (skip magic link entirely)
vibariant auth login --token <jwt> --api-url https://api.vibariant.com --json
```

**Flags:** `--email <email>`, `--token <jwt>`, `--api-url <url>`, `--json`, `--yes`

**Response (`--json`):**
```json
{ "ok": true, "data": { "email": "user@example.com", "apiUrl": "https://api.vibariant.com" } }
```

Credentials stored in `~/.vibariant/config.json` (0600 permissions, 7-day expiry).

## `vibariant auth status`

Check if currently authenticated and whether the token is still valid.

```bash
vibariant auth status --json
```

**Response:**
```json
{ "ok": true, "data": { "authenticated": true, "email": "user@example.com", "apiUrl": "...", "expiresAt": 1741..., "valid": true } }
```

When not authenticated: `{ "ok": true, "data": { "authenticated": false } }` (exit 0, not an error).

## `vibariant auth logout`

Clear stored credentials.

```bash
vibariant auth logout --json
```

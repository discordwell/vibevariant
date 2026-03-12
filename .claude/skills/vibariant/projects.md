# Project Commands

## `vibariant projects list`

```bash
vibariant projects list --json
```

**Response:** Array of `{ id, name, project_token, api_key }`.

## `vibariant projects create`

```bash
vibariant projects create "My App" --json
```

**Response:**
```json
{ "ok": true, "data": { "id": "...", "name": "My App", "project_token": "vv_proj_xxx", "api_key": "vv_sk_xxx" } }
```

- `project_token` (`vv_proj_xxx`) — public, client-side safe, used in SDK
- `api_key` (`vv_sk_xxx`) — secret, server-side only

## `vibariant projects show`

```bash
vibariant projects show <project-id> --json
```

Exits with code `3` if not found.

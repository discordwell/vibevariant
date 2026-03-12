# Experiment Commands

All experiment commands auto-resolve the project ID from `~/.vibariant/config.json` (set by `vibariant init`). Override with `--project-id <id>`.

## `vibariant experiments create`

```bash
vibariant experiments create --key hero-headline --name "Hero Headline" --variants control,bold,minimal --json
```

**Flags:** `--key <key>` (required in `--json`/`--yes` mode), `--name <name>` (defaults to key), `--variants <csv>` (defaults to `control,variant`), `--project-id <id>`, `--api-url <url>`, `--json`, `--yes`

Creates in `draft` status. To start immediately, follow with:
```bash
vibariant experiments update <id> --status running --json
```

## `vibariant experiments list`

```bash
vibariant experiments list --json
```

**Response:** Array of experiments with `id`, `key`, `name`, `status`, `variant_keys`, `traffic_percentage`.

## `vibariant experiments show`

Combined experiment metadata + Bayesian stats in one call. Accepts ID or key.

```bash
vibariant experiments show hero-headline --json
vibariant experiments show <uuid> --json
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "experiment": { "id": "...", "key": "hero-headline", "status": "running", "variant_keys": ["control", "bold"], "traffic_percentage": 1.0 },
    "results": {
      "decision_status": "keep_testing",
      "variants": [
        { "variant_key": "control", "visitors": 50, "conversions": 5, "conversion_rate": 0.1, "posterior_mean": 0.0962 },
        { "variant_key": "bold", "visitors": 50, "conversions": 8, "conversion_rate": 0.16, "posterior_mean": 0.1538 }
      ],
      "recommendation": "Keep testing. Bold variant shows promise but needs more data."
    }
  }
}
```

`results` is `null` for draft/paused experiments or when no data has been collected yet.

## `vibariant experiments results`

Detailed Bayesian results only (no experiment metadata).

```bash
vibariant experiments results <id> --json
```

## `vibariant experiments update`

```bash
vibariant experiments update <id> --status running --json
vibariant experiments update <id> --name "New Name" --json
```

**Status values:** `draft`, `running`, `paused`, `completed`

## `vibariant experiments delete`

```bash
vibariant experiments delete <id> --json --yes
```

Without `--yes` or `--json`, prompts for confirmation.

## Understanding Stats Output

**`decision_status`** — machine-readable verdict:
| Status | Meaning | Action |
|--------|---------|--------|
| `collecting_data` | Too few observations | Wait for more traffic |
| `keep_testing` | Differences emerging, not conclusive | Continue running |
| `ready_to_ship` | Winner identified (expected loss < 0.5%) | Ship the winner, complete the experiment |
| `practically_equivalent` | 95% HDI within ROPE | Variants are equivalent, pick either |

**`posterior_mean`** — Bayesian estimate of true conversion rate (more stable than raw `conversion_rate` at small samples).

**`recommendation`** — Plain-English action guidance.

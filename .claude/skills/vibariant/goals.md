# Goal Commands

Goals are auto-detected by the SDK from user interactions (clicks, form submissions, purchases). They need confirmation before counting as conversions.

## `vibariant goals list`

```bash
vibariant goals list --json
```

**Response:** Array of `{ id, type, label, confirmed }`.

## `vibariant goals confirm`

Mark a detected goal as a real conversion event.

```bash
vibariant goals confirm <goal-id> --json
```

Only confirmed goals count toward experiment conversion metrics.

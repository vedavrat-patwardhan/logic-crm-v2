# AMC automatic call generation

AMC service calls are created by a **scheduled trigger** that hits a secured
endpoint once a day. The endpoint is idempotent — a company that already has an
AMC call for the current IST day is skipped, so retries and double-runs never
create duplicates.

## Pieces

| Piece | Location |
|-------|----------|
| Generation logic | [`src/server/lib/amc.ts`](../src/server/lib/amc.ts) (`generateDueAmcCalls`) |
| Secured endpoint | `POST /api/cron/amc` — [`src/app/api/cron/amc/route.ts`](../src/app/api/cron/amc/route.ts) |
| Manual button | Customers page → "Add AMC calls" (same logic, still idempotent) |
| Scheduler (interim) | GitHub Actions — [`.github/workflows/amc-cron.yml`](../.github/workflows/amc-cron.yml) |

The endpoint requires `Authorization: Bearer $CRON_SECRET`. Requests without it
get `401`.

## Required setup

1. **`CRON_SECRET`** — a shared secret. It already exists in local `.env`.
   Set the **same value** in:
   - Netlify: Site settings → Environment variables → `CRON_SECRET`
   - GitHub: Repo → Settings → Secrets and variables → Actions → new secret `CRON_SECRET`
2. (Optional) GitHub repo variable **`AMC_ENDPOINT`** if the URL isn't
   `https://logic-crm-v2.netlify.app/api/cron/amc`.

The GitHub Action runs daily at `30 19 * * *` UTC = **01:00 IST**, and can also
be run on demand from the Actions tab (workflow_dispatch).

## Moving to the Hetzner server

When the app moves off Netlify, drop the GitHub Action and use a plain crontab
on the box. Add to `crontab -e` (server clock in UTC):

```cron
# 01:00 IST (19:30 UTC) — generate due AMC calls
30 19 * * * curl -fsS -X POST https://YOUR_DOMAIN/api/cron/amc -H "Authorization: Bearer YOUR_CRON_SECRET" >> /var/log/amc-cron.log 2>&1
```

If the server clock is set to IST instead, use `0 1 * * *`.

Nothing in the application changes between hosts — only where the daily HTTP
request comes from.

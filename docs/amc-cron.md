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
| Scheduler | Server crontab on Hetzner (01:00 IST / 19:30 UTC) |

The endpoint requires `Authorization: Bearer $CRON_SECRET`. Requests without it
get `401`.

## Required setup

1. **`CRON_SECRET`** — set in production `.env` on the server and in GitHub
   Actions secret `CRON_SECRET` for deploys.

## Hetzner server cron

On the server (`crontab -e` as `logicsys`, clock in UTC):

```cron
# 01:00 IST (19:30 UTC) — generate due AMC calls
30 19 * * * curl -fsS -X POST https://crm.logicnsk.com/api/cron/amc -H "Authorization: Bearer YOUR_CRON_SECRET" >> /var/log/logicsys/amc-cron.log 2>&1
```

If the server clock is set to IST instead, use `0 1 * * *`.

Nothing in the application changes between hosts — only where the daily HTTP
request comes from.

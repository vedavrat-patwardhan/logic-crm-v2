# Hetzner deployment

Server: `89.167.60.138` (Ubuntu 24.04)

## Apps

| App | Path | Port | Service |
|-----|------|------|---------|
| Landing page | `/var/www/logic-landing` | 3000 | `logic-landing` |
| Logic CRM | `/var/www/logic-crm` | 3001 | `logic-crm` |

## GitHub Actions secrets (both repos)

| Secret | Value |
|--------|-------|
| `SSH_HOST` | `89.167.60.138` |
| `SSH_USER` | `logicsys` |
| `SSH_PRIVATE_KEY` | Contents of `logic_system_server` private key |

### logic-crm-v2 only

| Secret / Variable | Purpose |
|-------------------|---------|
| `DATABASE_URL` | MongoDB connection string |
| `AUTH_SECRET` | NextAuth signing secret |
| `CRON_SECRET` | AMC cron endpoint bearer token |
| `NEXT_PUBLIC_APP_URL` (variable) | Public CRM URL, e.g. `https://crm.logicsys.in` |

### logic-systems-landing only

| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Resend API key |
| `CONTACT_TO` | `enquiry@logicsys.in` |
| `CONTACT_FROM` | Verified sender address |

## AMC cron (on server)

After nginx + domain are live, add to `crontab -e` on the server:

```cron
30 19 * * * curl -fsS -X POST https://YOUR_CRM_DOMAIN/api/cron/amc -H "Authorization: Bearer YOUR_CRON_SECRET" >> /var/log/amc-cron.log 2>&1
```

Then disable the GitHub Actions `amc-cron.yml` workflow or point `AMC_ENDPOINT` to the new domain.

## Next step: nginx + certbot

Reverse proxy `www.logicsys.in` → port 3000 and CRM subdomain → port 3001.

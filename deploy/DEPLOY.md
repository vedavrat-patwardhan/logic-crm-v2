# Hetzner deployment

Server: `89.167.60.138` (Ubuntu 24.04)

## Live URLs

| App | URL |
|-----|-----|
| Landing page | https://www.logicnsk.com |
| Logic CRM | https://crm.logicnsk.com |

## Apps on server

| App | Path | Port | Service |
|-----|------|------|---------|
| Landing page | `/var/www/logic-landing` | 3000 | `logic-landing` |
| Logic CRM | `/var/www/logic-crm` | 3001 | `logic-crm` |

## GitHub Actions — secrets & variables

### Both repos

| Secret | Value |
|--------|-------|
| `SSH_HOST` | `89.167.60.138` |
| `SSH_USER` | `logicsys` |
| `SSH_PRIVATE_KEY` | Full contents of `logic_system_server` private key file |

### logic-crm-v2 only

| Secret / Variable | Value |
|-------------------|-------|
| `DATABASE_URL` | MongoDB connection string |
| `AUTH_SECRET` | NextAuth signing secret |
| `CRON_SECRET` | AMC cron bearer token |
| `NEXT_PUBLIC_APP_URL` (variable) | `https://crm.logicnsk.com` |

### logic-systems-landing only

| Secret | Value |
|--------|-------|
| `RESEND_API_KEY` | Resend API key |
| `CONTACT_TO` | `enquiry@logicsys.in` |
| `CONTACT_FROM` | Verified sender in Resend |

## AMC cron

Runs on the server via crontab — see [`docs/amc-cron.md`](../docs/amc-cron.md).

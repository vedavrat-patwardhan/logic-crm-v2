#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/logic-crm"
LOG_DIR="/var/log/logicsys"

cd "$APP_DIR"

echo "==> Pulling latest code..."
git fetch origin main
git reset --hard origin/main

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

echo "==> Building..."
pnpm build

echo "==> Restarting service..."
sudo systemctl restart logic-crm
sudo systemctl is-active logic-crm

echo "==> Deploy complete: logic-crm"

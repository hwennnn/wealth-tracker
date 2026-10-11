#!/bin/sh
# Nightly logical backup. Keeps the last 30 days.
#   cron: 15 3 * * * /home/houman/wealth-tracker-db/scripts/backup.sh >> /home/houman/wealth-tracker-db/backups/backup.log 2>&1
set -e
cd "$(dirname "$0")/.."
mkdir -p backups
OUT="backups/wealth-$(date +%Y%m%d-%H%M%S).sql.gz"
docker compose exec -T db pg_dump -U postgres -d wealth --data-only --schema=public | gzip > "$OUT"
find backups -name 'wealth-*.sql.gz' -mtime +30 -delete
echo "$(date -Is) wrote $OUT"

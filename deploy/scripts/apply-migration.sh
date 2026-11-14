#!/bin/sh
# Apply one SQL migration to the database running in this directory, then
# tell PostgREST to reload its schema cache.
#
# Run on the VPS from ~/wealth-tracker-db (the copy of deploy/). This does
# not connect anywhere until you run it.
#
#   ./scripts/apply-migration.sh migrations/002_credit_cards.sql
set -e
cd "$(dirname "$0")/.."
FILE=${1:?usage: ./scripts/apply-migration.sh migrations/002_credit_cards.sql}
if [ ! -f "$FILE" ]; then
  echo "migration file not found: $FILE" >&2
  exit 1
fi
docker compose exec -T db psql -U postgres -d wealth -v ON_ERROR_STOP=1 < "$FILE"
docker compose exec -T db psql -U postgres -d wealth -c "NOTIFY pgrst, 'reload schema';"
echo "applied $FILE"

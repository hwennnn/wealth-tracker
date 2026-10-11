#!/bin/sh
# Loads categories + entries from a Supabase cluster dump (.gz) into the local db.
# Wipes existing rows first, so it's safe to re-run with a newer dump.
#   ./scripts/import-supabase-dump.sh /path/to/backup.gz
set -e
cd "$(dirname "$0")/.."
DUMP="$1"
[ -f "$DUMP" ] || { echo "usage: $0 <supabase-dump.gz>"; exit 1; }
{
  echo "BEGIN;"
  echo "TRUNCATE public.entries, public.categories;"
  gzip -dc "$DUMP" | awk '
    /^COPY public\.categories /{p=1}
    /^COPY public\.entries /{p=1}
    p{print}
    p && /^\\\.$/{p=0}'
  echo "COMMIT;"
} | docker compose exec -T db psql -v ON_ERROR_STOP=1 -U postgres -d wealth -q
docker compose exec -T db psql -U postgres -d wealth -c \
  "SELECT (SELECT count(*) FROM categories) AS categories, (SELECT count(*) FROM entries) AS entries;"

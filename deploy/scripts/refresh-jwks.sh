#!/bin/sh
# Pulls Clerk's current signing keys into .env as PGRST_JWT_SECRET, then
# restarts PostgREST. Re-run if Clerk ever rotates keys (requests start 401ing).
set -e
cd "$(dirname "$0")/.."
JWKS=$(curl -fsS https://clerk.hwendev.com/.well-known/jwks.json)
sed -i '/^PGRST_JWT_SECRET=/d' .env
printf "PGRST_JWT_SECRET='%s'\n" "$JWKS" >> .env
if docker compose ps -q postgrest | grep -q .; then docker compose up -d postgrest; fi
echo "JWKS refreshed."

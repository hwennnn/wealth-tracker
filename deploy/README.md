# Database stack

Postgres 16 + PostgREST v12, running on houman-vps in `~/wealth-tracker-db`, outside Coolify.
PostgREST is the REST layer Supabase uses, so the app still talks to it through `supabase-js`.

```
browser ──https──▶ Traefik (coolify-proxy)
                    ├─ wealth.hwendev.com/rest/v1/*  ─strip─▶ postgrest:3000 ──▶ db:5432 (internal network only)
                    └─ wealth.hwendev.com/*          ───────▶ SPA (Coolify app)
```

## Auth

- The frontend sends the default Clerk session token (`getToken()`, RS256).
- PostgREST verifies it against Clerk's JWKS, which is stored in `.env` as `PGRST_JWT_SECRET`.
- The token has no `role` claim, so every request runs as `web_user`.
- RLS policies check `auth.jwt() ->> 'sub' = user_id`. Requests with no token get no rows, and requests with a bad token get a 401.

If Clerk rotates its signing keys, requests will start returning 401. To fix that, run `./scripts/refresh-jwks.sh`.

## Ops

```bash
ssh houman-vps && cd ~/wealth-tracker-db

docker compose ps / logs -f postgrest
docker compose exec db psql -U postgres -d wealth     # SQL shell

./scripts/backup.sh                                     # also runs nightly via cron (03:15), keeps 30 days in backups/
gunzip -c backups/wealth-XXXX.sql.gz | docker compose exec -T db psql -U postgres -d wealth   # restore (truncate tables first)
./scripts/import-supabase-dump.sh dump.gz               # re-import from a Supabase cluster dump (wipes current rows)
```

## Fresh install

```bash
scp -r deploy/ houman-vps:~/wealth-tracker-db
cp .env.example .env    # set POSTGRES_PASSWORD and AUTHENTICATOR_PASSWORD
./scripts/refresh-jwks.sh
docker compose up -d    # init/01-schema.sh creates the roles, schema and RLS on first boot
```

Schema changes after the first boot have to be applied by hand with psql, because the init scripts only run on an empty data volume. After a change, reload PostgREST with `NOTIFY pgrst, 'reload schema';`.

## Migrations

SQL files in `migrations/` are for a database that already has data. `init/01-schema.sh` is only for an empty volume. Pushing the frontend does not apply these files.

`003_category_kind.sql` adds `categories.kind` (`asset` or `credit_card`) and optional `categories.parent_id` (the bank a card belongs to). If `credit_cards` / `credit_card_statements` exist, it copies them into categories and entries, then drops those tables. It is safe to re-run.

Apply this **before** using the frontend that reads `kind`. The previous frontend ignores the new columns, so the migration can land first. If the new frontend is deployed first, category loads fail until this runs.

```bash
scp deploy/migrations/003_category_kind.sql houman-vps:~/wealth-tracker-db/migrations/003_category_kind.sql

ssh houman-vps 'cd ~/wealth-tracker-db && docker compose exec -T db psql -U postgres -d wealth -v ON_ERROR_STOP=1 < migrations/003_category_kind.sql'

ssh houman-vps "cd ~/wealth-tracker-db && docker compose exec -T db psql -U postgres -d wealth -c \"NOTIFY pgrst, 'reload schema';\""
```

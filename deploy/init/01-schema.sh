#!/bin/sh
# Runs once, on first boot of an empty data volume.
set -e
psql -v ON_ERROR_STOP=1 -U postgres -d wealth -v authpw="$AUTHENTICATOR_PASSWORD" <<'SQL'
-- PostgREST roles
CREATE ROLE authenticator LOGIN NOINHERIT PASSWORD :'authpw';
CREATE ROLE web_user NOLOGIN;
GRANT web_user TO authenticator;

-- Supabase-compatible helper so RLS policies read the same as before
CREATE SCHEMA auth;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
GRANT USAGE ON SCHEMA auth TO web_user;
GRANT EXECUTE ON FUNCTION auth.jwt() TO web_user;

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    user_id text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.entries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    amount numeric(12,2) NOT NULL,
    currency text NOT NULL,
    date date NOT NULL,
    notes text,
    user_id text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_categories_user_id ON public.categories (user_id);
CREATE INDEX idx_entries_category_id ON public.entries (category_id);
CREATE INDEX idx_entries_date ON public.entries (date);
CREATE INDEX idx_entries_user_id ON public.entries (user_id);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_categories ON public.categories FOR ALL TO web_user
  USING ((auth.jwt() ->> 'sub') = user_id) WITH CHECK ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY own_entries ON public.entries FOR ALL TO web_user
  USING ((auth.jwt() ->> 'sub') = user_id) WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

GRANT USAGE ON SCHEMA public TO web_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories, public.entries TO web_user;
SQL

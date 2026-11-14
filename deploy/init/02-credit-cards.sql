-- Credit cards attached to an account (a row in categories) and their statements.
-- Safe to re-run. Fresh volumes also apply this via deploy/init/02-credit-cards.sql.
--
-- Outstanding debt is NOT stored as a running total. The app subtracts the latest
-- statement per card (see src/lib/netWorth.ts). Apply on the VPS with:
--   docker compose exec -T db psql -U postgres -d wealth -v ON_ERROR_STOP=1 < migrations/002_credit_cards.sql
--   docker compose exec -T db psql -U postgres -d wealth -c "NOTIFY pgrst, 'reload schema';"

DO $$
BEGIN
  ALTER TABLE public.categories
    ADD CONSTRAINT categories_id_user_id_key UNIQUE (id, user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.credit_cards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id uuid NOT NULL,
    name text NOT NULL,
    currency text NOT NULL,
    notes text,
    user_id text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (id, user_id),
    FOREIGN KEY (category_id, user_id)
      REFERENCES public.categories (id, user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.credit_card_statements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    credit_card_id uuid NOT NULL,
    statement_date date NOT NULL,
    period_start date,
    balance_owed numeric(12,2) NOT NULL CHECK (balance_owed >= 0),
    due_date date,
    minimum_payment numeric(12,2) CHECK (minimum_payment IS NULL OR minimum_payment >= 0),
    currency text NOT NULL,
    notes text,
    user_id text NOT NULL,
    created_at timestamptz DEFAULT now(),
    FOREIGN KEY (credit_card_id, user_id)
      REFERENCES public.credit_cards (id, user_id) ON DELETE CASCADE,
    CHECK (period_start IS NULL OR period_start <= statement_date),
    CHECK (due_date IS NULL OR due_date >= statement_date)
);

CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON public.credit_cards (user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_category_id ON public.credit_cards (category_id);
CREATE INDEX IF NOT EXISTS idx_cc_statements_user_id ON public.credit_card_statements (user_id);
CREATE INDEX IF NOT EXISTS idx_cc_statements_card_id ON public.credit_card_statements (credit_card_id);
CREATE INDEX IF NOT EXISTS idx_cc_statements_date ON public.credit_card_statements (statement_date);

ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_statements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS own_credit_cards ON public.credit_cards;
CREATE POLICY own_credit_cards ON public.credit_cards
  FOR ALL TO web_user
  USING ((auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS own_credit_card_statements ON public.credit_card_statements;
CREATE POLICY own_credit_card_statements ON public.credit_card_statements
  FOR ALL TO web_user
  USING ((auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_cards, public.credit_card_statements TO web_user;

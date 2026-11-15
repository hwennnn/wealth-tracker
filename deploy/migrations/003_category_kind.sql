-- A credit card is a category (kind = credit_card), optionally linked to a bank
-- category. Its snapshot rows are ordinary entries; the amount is the balance owed.
--
-- Idempotent. Copies any credit_cards / credit_card_statements rows into
-- categories / entries, then drops those tables.
--
-- Apply on the VPS before using the frontend that reads categories.kind.
-- Commands are in deploy/README.md.

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'asset';

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id uuid;

DO $$
BEGIN
  ALTER TABLE public.categories
    ADD CONSTRAINT categories_kind_check CHECK (kind IN ('asset', 'credit_card'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.categories
    ADD CONSTRAINT categories_parent_id_fkey
    FOREIGN KEY (parent_id) REFERENCES public.categories (id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.categories
    ADD CONSTRAINT categories_parent_not_self CHECK (parent_id IS DISTINCT FROM id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.categories
    ADD CONSTRAINT categories_asset_has_no_parent CHECK (kind = 'credit_card' OR parent_id IS NULL);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories (parent_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'credit_cards'
  ) THEN
    INSERT INTO public.categories (id, name, description, user_id, kind, parent_id)
    SELECT
      cc.id,
      cc.name,
      NULLIF(cc.notes, ''),
      cc.user_id,
      'credit_card',
      CASE
        WHEN EXISTS (SELECT 1 FROM public.categories c WHERE c.id = cc.category_id)
          THEN cc.category_id
        ELSE NULL
      END
    FROM public.credit_cards cc
    WHERE NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.id = cc.id);

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'credit_card_statements'
    ) THEN
      INSERT INTO public.entries (id, category_id, amount, currency, date, notes, user_id)
      SELECT
        s.id,
        s.credit_card_id,
        s.balance_owed,
        s.currency,
        s.statement_date,
        s.notes,
        s.user_id
      FROM public.credit_card_statements s
      WHERE EXISTS (SELECT 1 FROM public.categories c WHERE c.id = s.credit_card_id)
        AND NOT EXISTS (SELECT 1 FROM public.entries e WHERE e.id = s.id);
    END IF;
  END IF;
END $$;

DROP TABLE IF EXISTS public.credit_card_statements;
DROP TABLE IF EXISTS public.credit_cards;

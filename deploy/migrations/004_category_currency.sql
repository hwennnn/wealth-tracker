-- Each account (category) gets a home currency. New snapshot rows start in it;
-- each row can still be recorded in a different currency.
--
-- Idempotent. Backfills from the currency of each account's most recent entry,
-- then lets a card with no entries use its bank's currency. Only fills NULLs.
--
-- Safe to apply before the frontend that reads categories.currency: the older
-- frontend ignores the column. Commands are in deploy/README.md.

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS currency text;

UPDATE public.categories c
SET currency = latest.currency
FROM (
  SELECT DISTINCT ON (category_id) category_id, currency
  FROM public.entries
  ORDER BY category_id, date DESC, created_at DESC
) latest
WHERE latest.category_id = c.id
  AND c.currency IS NULL;

UPDATE public.categories card
SET currency = bank.currency
FROM public.categories bank
WHERE card.parent_id = bank.id
  AND card.currency IS NULL
  AND bank.currency IS NOT NULL;

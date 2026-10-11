# CLAUDE.md

This file provides context for Claude Code when working on this project.

## Project Overview

WealthTracker is a personal net worth tracking app. Users record periodic "snapshots" of their assets across categories (savings, investments, crypto, etc.) in multiple currencies. The app converts everything to a configurable display currency and visualizes growth over time.

**Live:** https://wealth.hwendev.com

## Architecture

### Auth: Clerk JWT → PostgREST
- Authentication is handled by Clerk (`@clerk/clerk-react`)
- Every database request includes the default Clerk session token (RS256)
- The token is fetched via `useAuth().getToken()` and injected into a custom supabase-js client via `createClerkSupabaseClient()`
- PostgREST verifies tokens against Clerk's JWKS (`deploy/scripts/refresh-jwks.sh`); tokens have no `role` claim so all requests run as `web_user`
- Clerk user IDs (format: `user_xxx`) are stored in `user_id` columns (type `text`)
- RLS policies enforce `auth.jwt() ->> 'sub' = user_id` on all tables

### Database: self-hosted PostgreSQL + PostgREST (on houman-vps)
- Runs from `deploy/` on houman-vps in `~/wealth-tracker-db` (not managed by Coolify); Traefik routes `wealth.hwendev.com/rest/v1/*` to PostgREST
- supabase-js is still used as the client library (it speaks PostgREST); the URL is `window.location.origin`
- Two main tables: `categories`, `entries`
- Nightly `pg_dump` via cron (`deploy/scripts/backup.sh`, kept 30 days in `~/wealth-tracker-db/backups`)
- All queries go through an authenticated Supabase client (Clerk JWT in Authorization header)
- RLS is enabled — every row is scoped to the authenticated user at the database level
- `user_id` columns are `text` type (to accommodate Clerk IDs)
- No stored procedures or views; only `auth.jwt()` (Supabase-compatible helper used by RLS)

### State Management
- All app state lives in `App.tsx` (`AuthenticatedApp` component)
- The authenticated Supabase client is created via `useMemo` using `createClerkSupabaseClient()`
- No Redux, no Zustand, no React Context for data
- Goals and milestones use localStorage (no DB)

### Currency Conversion
- Exchange rates fetched from exchangerate-api.com (v6 API)
- Cached in localStorage for 6 hours
- Rates are always USD-based; cross-currency conversion uses: `amount / rates[from] * rates[to]`
- Display currency is user-configurable, stored in localStorage

### Environment Variables
All secrets are in environment variables (`.env` file, gitignored):
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk frontend key
- `VITE_EXCHANGE_RATE_API_KEY` — ExchangeRate-API key

Vite embeds `VITE_*` vars at build time. For Docker, pass them as `--build-arg`.

## Key Conventions

- **UI components**: shadcn/ui (in `src/components/ui/`)
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Charts**: Recharts (AreaChart, PieChart)
- **Date handling**: date-fns
- **Toasts**: sonner
- **Icons**: lucide-react
- **Routing**: React Router v6

## Build & Deploy

```bash
npm run dev      # Development server
npm run build    # Production build (outputs to dist/)
npm run preview  # Preview production build
```

Docker deployment uses a multi-stage build: Node for building, nginx:alpine for serving. Build args are required for env vars.

## Common Patterns

### Adding a new page
1. Create component in `src/pages/`
2. Add route in `App.tsx` — public pages go before the `/*` catch-all, authenticated pages go inside `AuthenticatedApp`
3. Wrap authenticated pages with `<Layout>`

### Adding a new database query
All database queries are in `AuthenticatedApp` in `App.tsx`. The `supabase` client is already authenticated with Clerk JWT. Always:
- Guard with `if (!userId) return`
- Filter with `.eq("user_id", userId)`
- RLS enforces this at DB level too, but app-level filtering is still good practice

### Theme support
CSS variables are defined in `src/index.css` for both `:root` (light) and `.dark` (dark). The `useTheme` hook manages the toggle. Clerk components inherit theme via `appearance` prop on `ClerkProvider`.

## Important Notes

- `src/integrations/supabase/client.ts` exports `createClerkSupabaseClient()`; use it inside `AuthenticatedApp`. Unauthenticated requests see no rows.
- `npm run dev` proxies `/rest/v1` to prod (`VITE_DEV_API_PROXY` to override), so local dev reads/writes real data.
- `TimelineEntry` is a client-side construct — entries are grouped by date in the app, not in the DB
- `total_amount` on `TimelineEntry` sums raw amounts without currency conversion (conversion happens at render time)
- Privacy policy at `/privacy` and Terms at `/terms` are public pages (no auth required)

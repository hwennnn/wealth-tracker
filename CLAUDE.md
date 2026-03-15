# CLAUDE.md

This file provides context for Claude Code when working on this project.

## Project Overview

WealthTracker is a personal net worth tracking app. Users record periodic "snapshots" of their assets across categories (savings, investments, crypto, etc.) in multiple currencies. The app converts everything to a configurable display currency and visualizes growth over time.

**Live:** https://wealth.hwendev.com

## Architecture

### Auth: Clerk + Supabase JWT
- Authentication is handled by Clerk (`@clerk/clerk-react`)
- Every Supabase request includes a Clerk JWT token (template name: `supabase`)
- The token is fetched via `useAuth().getToken({ template: "supabase" })` and injected into a custom Supabase client via `createClerkSupabaseClient()`
- Clerk user IDs (format: `user_xxx`) are stored in `user_id` columns (type `text`)
- RLS policies enforce `auth.jwt() ->> 'sub' = user_id` on all tables

### Database: Supabase (PostgreSQL)
- Two main tables: `categories`, `entries`
- All queries go through an authenticated Supabase client (Clerk JWT in Authorization header)
- RLS is enabled — every row is scoped to the authenticated user at the database level
- `user_id` columns are `text` type (to accommodate Clerk IDs)
- No stored procedures, no views, no database functions

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
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key
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
All Supabase queries are in `AuthenticatedApp` in `App.tsx`. The `supabase` client is already authenticated with Clerk JWT. Always:
- Guard with `if (!userId) return`
- Filter with `.eq("user_id", userId)`
- RLS enforces this at DB level too, but app-level filtering is still good practice

### Theme support
CSS variables are defined in `src/index.css` for both `:root` (light) and `.dark` (dark). The `useTheme` hook manages the toggle. Clerk components inherit theme via `appearance` prop on `ClerkProvider`.

## Important Notes

- The Supabase client in `src/integrations/supabase/client.ts` exports two things: `createClerkSupabaseClient()` (authenticated) and `supabase` (default/unauthenticated). Always use the authenticated client inside `AuthenticatedApp`.
- `TimelineEntry` is a client-side construct — entries are grouped by date in the app, not in the DB
- `total_amount` on `TimelineEntry` sums raw amounts without currency conversion (conversion happens at render time)
- Privacy policy at `/privacy` and Terms at `/terms` are public pages (no auth required)

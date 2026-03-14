# CLAUDE.md

This file provides context for Claude Code when working on this project.

## Project Overview

WealthTracker is a personal net worth tracking app. Users record periodic "snapshots" of their assets across categories (savings, investments, crypto, etc.) in multiple currencies. The app converts everything to a configurable display currency and visualizes growth over time.

**Live:** https://wealth.hwendev.com

## Architecture

### Auth: Clerk
- Authentication is handled entirely by Clerk (`@clerk/clerk-react`)
- Supabase is used ONLY as a database — not for auth
- Clerk user IDs (format: `user_xxx`) are stored in `user_id` columns (type `text`, not `uuid`)
- Row Level Security is disabled — auth is enforced at the application layer by always filtering with `.eq("user_id", userId)`

### Database: Supabase (PostgreSQL)
- Three tables: `profiles`, `categories`, `entries`
- All queries go through the Supabase JS client with the anon key
- No stored procedures, no views, no database functions
- `user_id` columns are `text` type (to accommodate Clerk IDs)

### State Management
- All app state lives in `App.tsx` (`AuthenticatedApp` component)
- No Redux, no Zustand, no React Context for data
- TanStack Query is installed but not used — data fetching is manual `useEffect` + Supabase client
- Goals and milestones use localStorage (no DB)

### Currency Conversion
- Exchange rates fetched from exchangerate-api.com (v6 API)
- Cached in localStorage for 6 hours
- Rates are always USD-based; cross-currency conversion uses: `amount / rates[from] * rates[to]`
- Display currency is user-configurable, stored in localStorage

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

Docker deployment uses a multi-stage build: Node for building, nginx:alpine for serving.

## Common Patterns

### Adding a new page
1. Create component in `src/pages/`
2. Add route in `AuthenticatedApp` component in `App.tsx`
3. Wrap with `<Layout>` for nav/footer

### Adding a new database query
All Supabase queries are in `App.tsx`. Always:
- Guard with `if (!userId) return`
- Filter with `.eq("user_id", userId)`
- Update local state after mutation (optimistic or on success)

### Theme support
CSS variables are defined in `src/index.css` for both `:root` (light) and `.dark` (dark). The `useTheme` hook manages the toggle. Clerk components inherit theme via `appearance` prop on `ClerkProvider`.

## Important Notes

- The Clerk publishable key is hardcoded in `App.tsx` (not env var)
- The Supabase URL and anon key are hardcoded in `src/integrations/supabase/client.ts`
- The exchange rate API key is hardcoded in `src/lib/currency.ts`
- `TimelineEntry` is a client-side construct — entries are grouped by date in the app, not in the DB
- `total_amount` on `TimelineEntry` sums raw amounts without currency conversion (conversion happens at render time)

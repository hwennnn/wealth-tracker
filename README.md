# WealthTracker

A personal net worth tracker with multi-currency support, interactive charts, and bulk asset recording.

**Live:** [wealth.hwendev.com](https://wealth.hwendev.com) | **Status:** [status.hwendev.com](https://status.hwendev.com/status/wealth-tracker)

## Features

- **Multi-currency support** — Track assets in SGD, USD, EUR, and more with live exchange rate conversion
- **Bulk snapshots** — Record all your assets at once with a spreadsheet-style form
- **Interactive charts** — Wealth growth over time (area chart) and asset distribution (donut chart) with time range filters (3M/6M/1Y/All)
- **Category trends** — Per-category sparkline charts showing individual asset growth
- **Goal tracking** — Set net worth targets with deadlines and track progress
- **Milestone celebrations** — Get notified when you hit milestones ($1K, $10K, $100K, etc.)
- **Month-over-month change** — See how your net worth changed since last snapshot
- **CSV import/export** — Bulk import from CSV or export your data for backup
- **Dark mode** — Light, dark, and system theme support
- **Configurable display currency** — Switch your display currency anytime from the header
- **Guided onboarding** — New users get a category selection flow to get started quickly
- **Edit entries** — Update any asset entry directly from the entries view
- **Mobile responsive** — Works on desktop, tablet, and mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| Exchange Rates | ExchangeRate-API |
| Deployment | Docker + Coolify |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Clerk](https://clerk.com) account (for authentication)
- A [Supabase](https://supabase.com) project (for the database)
- An [ExchangeRate-API](https://www.exchangerate-api.com/) key (free tier works)

> For detailed setup instructions (Clerk, Supabase schema, RLS policies, deployment), see **[docs/SETUP.md](docs/SETUP.md)**.

### Setup

```bash
# Clone the repo
git clone https://github.com/hwennnn/wealth-timeline-tracker.git
cd wealth-timeline-tracker

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Environment

The app expects the following configuration (currently hardcoded in source — see below for where to update):

| Config | File | Description |
|--------|------|-------------|
| Clerk Publishable Key | `src/App.tsx` | Your Clerk frontend key |
| Supabase URL | `src/integrations/supabase/client.ts` | Your Supabase project URL |
| Supabase Anon Key | `src/integrations/supabase/client.ts` | Your Supabase anon/public key |
| Exchange Rate API Key | `src/lib/currency.ts` | Free API key from exchangerate-api.com |

### Database Schema

The app uses three tables in Supabase:

```sql
-- User profiles
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset categories (e.g., Savings, Investments, Crypto)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual asset entries
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  user_id TEXT NOT NULL
);
```

### Docker Deployment

The project includes a multi-stage Dockerfile for production:

```bash
docker build -t wealth-tracker .
docker run -p 80:80 wealth-tracker
```

The final image is ~25MB (nginx + static files).

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui primitives
│   ├── BulkEntryForm    # Spreadsheet-style entry form
│   ├── CategoryTrends   # Per-category sparkline charts
│   ├── GoalDialog       # Goal setting modal
│   ├── Layout           # App shell (nav, footer)
│   ├── Onboarding       # New user category setup
│   ├── WealthChart      # Growth + distribution charts
│   └── WealthSummaryCard # Net worth card with MoM change
├── hooks/
│   └── use-theme        # Dark/light/system theme
├── lib/
│   ├── auth             # Clerk migration helpers
│   ├── csv              # CSV import/export
│   ├── currency         # Exchange rates + formatting
│   ├── currencyData     # Supported currencies list
│   ├── goals            # Goal & milestone tracking (localStorage)
│   └── types            # TypeScript type definitions
├── pages/
│   ├── Auth             # Sign in/up page (Clerk)
│   ├── Categories       # Category CRUD
│   ├── Dashboard        # Main dashboard
│   ├── Entries          # Entry list + edit + delete
│   └── NewEntry         # Bulk entry creation
├── App.tsx              # Root component, routing, state
└── main.tsx             # Entry point
```

## License

MIT

# Setup Guide

Complete guide to set up WealthTracker from scratch.

## 1. Clerk (Authentication)

### Create a Clerk Application

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Enable the sign-in methods you want:
   - **Email/Password** (recommended)
   - **Google OAuth** (optional)
   - **GitHub OAuth** (optional)
4. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)

### Configure Environment

Add to your `.env` file:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

### Production

1. Go to Clerk Dashboard → **API Keys**
2. Switch to **Production** instance
3. Use the production publishable key (`pk_live_...`)
4. Add your production domain under **Domains** in Clerk settings

---

## 2. Supabase (Database)

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a project
2. Note your **Project URL** and **anon/public key** from Settings → API

### Configure Environment

Add to your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Create Tables

Run in **Supabase → SQL Editor**:

```sql
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SGD',
  date TIMESTAMPTZ NOT NULL,
  notes TEXT DEFAULT '',
  user_id TEXT NOT NULL
);

CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_entries_user_id ON entries(user_id);
CREATE INDEX idx_entries_date ON entries(date DESC);
CREATE INDEX idx_entries_category_id ON entries(category_id);
```

### Row Level Security (RLS)

Since authentication is handled by Clerk, we configure Supabase to verify Clerk JWTs and enforce per-user access at the database level.

#### Step 1: Configure Clerk as JWT provider

1. In your **Clerk Dashboard** → **JWT Templates** → **Create New**
2. Select **Supabase** template
3. Copy the **JWKS Endpoint** URL (looks like `https://your-app.clerk.accounts.dev/.well-known/jwks.json`)
4. In **Supabase Dashboard** → **Authentication** → **Sign In / Up** → **JWT Settings**
5. Set the **JWT Secret** to your Clerk JWKS endpoint

> See [Clerk + Supabase integration guide](https://clerk.com/docs/integrations/databases/supabase) for detailed steps.

#### Step 2: Enable RLS and create policies

Run in **Supabase → SQL Editor**:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.jwt() ->> 'sub' = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.jwt() ->> 'sub' = id)
  WITH CHECK (auth.jwt() ->> 'sub' = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = id);

-- Categories: users can only access their own categories
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id)
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.jwt() ->> 'sub' = user_id);

-- Entries: users can only access their own entries
CREATE POLICY "Users can view own entries"
  ON entries FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own entries"
  ON entries FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own entries"
  ON entries FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id)
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own entries"
  ON entries FOR DELETE
  USING (auth.jwt() ->> 'sub' = user_id);
```

#### Step 3: Pass Clerk token to Supabase (app code)

To make RLS work, each Supabase request must include the Clerk session token. Update the Supabase client to use Clerk's token:

```ts
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export function createSupabaseClient(token?: string) {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

// Default client (no auth, for initial setup)
export const supabase = createSupabaseClient();
```

Then in your app, get the Clerk token and create an authenticated client:

```ts
const { getToken } = useAuth();
const token = await getToken({ template: "supabase" });
const supabase = createSupabaseClient(token);
```

> **Note:** The current codebase uses the simpler approach (RLS disabled, app-layer filtering). To enable full RLS, you'll need to update the Supabase client to pass Clerk tokens as shown above.

### Clean Up (if migrating from Supabase Auth)

If you previously used Supabase Auth, run this to remove old constraints:

```sql
ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_user_id_fkey;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_user_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;
```

---

## 3. ExchangeRate-API (Currency Conversion)

1. Go to [exchangerate-api.com](https://www.exchangerate-api.com/) and create a free account
2. Copy your API key
3. Add to your `.env` file:

```env
VITE_EXCHANGE_RATE_API_KEY=your_api_key_here
```

The free tier provides 1,500 requests/month with daily rate updates.

---

## 4. Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_EXCHANGE_RATE_API_KEY=your-exchangerate-api-key
```

For production deployments (Coolify, Docker, etc.), set these as environment variables in your hosting platform. Vite embeds `VITE_*` variables at build time.

---

## 5. Deployment

### Docker (recommended)

```bash
docker build -t wealth-tracker \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx \
  --build-arg VITE_SUPABASE_URL=https://xxx.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=xxx \
  --build-arg VITE_EXCHANGE_RATE_API_KEY=xxx \
  .

docker run -p 80:80 wealth-tracker
```

Update the `Dockerfile` to accept build args:

```dockerfile
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_EXCHANGE_RATE_API_KEY
```

### Coolify

1. Create a new resource → **Dockerfile** build pack
2. Set repository to your GitHub repo, branch `main`
3. Add environment variables in the resource settings (Build section)
4. Set domain (e.g., `wealth.yourdomain.com`)
5. Deploy

### Other Platforms

Since this is a static React app, you can deploy to any static hosting:

```bash
npm run build
# Upload the `dist/` directory
```

The included `nginx.conf` handles SPA routing.

---

## 6. DNS

Add an A record for your domain:

| Type | Name | Value |
|------|------|-------|
| A | `wealth` | `<your-server-ip>` |

SSL is handled automatically by Coolify (Let's Encrypt) or your reverse proxy.

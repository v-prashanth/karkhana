# Karkhana — Architecture Guide
Version 1.0
Last Updated: July 2026

---

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js App Router | 14 |
| Language | TypeScript | 5+ |
| Styling | Tailwind CSS | 3+ |
| Database | PostgreSQL (Supabase) | 15 |
| Auth | Supabase Auth | Latest |
| Storage | Supabase Storage | Latest |
| State | Zustand | Latest |
| ORM | Supabase JS Client | Latest |
| Email | Nodemailer | Latest |
| Deployment | Vercel | Latest |

---

## Multi-Tenancy

Every business is an "organization" (org).

Tenant isolation is enforced at the database level
via PostgreSQL Row Level Security (RLS).

The isolation function:
```sql
public.get_current_org_id()
```

Every table that contains tenant data:
1. Has an `org_id UUID` column
2. Has RLS enabled
3. Has a policy using `get_current_org_id()`

NEVER bypass RLS in client-side code.
ONLY use service role (admin client) in 
server-side API routes where explicitly needed.

---

## Folder Structure

```
karkhana/
├── supabase/
│   └── migrations/          # SQL files, sequential
│       ├── 00000_schema.sql
│       ├── 00001_universal_schema.sql
│       └── ...
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, Register pages
│   │   ├── (dashboard)/     # Protected dashboard
│   │   │   ├── layout.tsx   # Sidebar + nav
│   │   │   ├── dashboard/   # Home/metrics
│   │   │   ├── leads/       # External leads
│   │   │   ├── clients/     # CRM contacts
│   │   │   ├── jobs/        # Job orders
│   │   │   ├── network/     # B2B connections
│   │   │   ├── settings/    # Org settings
│   │   │   │   ├── billing/
│   │   │   │   └── integrations/
│   │   │   └── ...
│   │   ├── api/
│   │   │   ├── auth/        # Auth endpoints
│   │   │   ├── external/    # External API (API key auth)
│   │   │   │   ├── verify/
│   │   │   │   ├── leads/
│   │   │   │   ├── sso/
│   │   │   │   └── products/
│   │   │   ├── network/     # B2B network
│   │   │   ├── settings/
│   │   │   │   ├── api-keys/
│   │   │   │   └── coupons/
│   │   │   └── ...          # Feature routes
│   │   ├── auth/
│   │   │   ├── callback/    # Supabase callback
│   │   │   ├── confirm/     # Magic link confirm
│   │   │   └── sso/         # SSO landing page
│   │   └── setup/           # Onboarding wizard
│   ├── components/
│   │   ├── layout/          # Sidebar, Navbar, Footer
│   │   ├── shared/          # Shared across features
│   │   └── ui/              # Primitive UI components
│   ├── hooks/               # Custom React hooks
│   ├── lib/
│   │   ├── api/             # Client-side API abstractions
│   │   │   ├── connections.ts
│   │   │   ├── validate-api-key.ts  # Server-only
│   │   │   └── ...
│   │   ├── supabase/
│   │   │   ├── browser.ts   # Client-side Supabase
│   │   │   ├── server.ts    # Server-side Supabase
│   │   │   └── admin.ts     # Service role (server-only)
│   │   └── utils.ts
│   ├── store/               # Zustand global state
│   └── types/               # TypeScript definitions
└── docs/                    # This folder
    ├── 00_AI_DEVELOPMENT_RULES.md
    ├── 01_KARKHANA_BLUEPRINT.md
    └── 02_ARCHITECTURE_GUIDE.md
```

---

## Database Schema

### Core Tables

#### organizations
```
id              UUID PRIMARY KEY
name            TEXT
plan            TEXT DEFAULT 'free'
plan_expires_at TIMESTAMPTZ
created_at      TIMESTAMPTZ
```

#### profiles
```
id              UUID (= auth.users.id)
org_id          UUID → organizations.id
full_name       TEXT
phone           TEXT
created_at      TIMESTAMPTZ
```

#### contacts
```
id              UUID PRIMARY KEY
org_id          UUID → organizations.id
name            TEXT
phone           TEXT
email           TEXT
tags            TEXT[]
balance         NUMERIC
created_at      TIMESTAMPTZ
```

#### orders
```
id              UUID PRIMARY KEY
org_id          UUID → organizations.id
contact_id      UUID → contacts.id
title           TEXT
quantity        NUMERIC
status          TEXT
priority        TEXT
created_at      TIMESTAMPTZ
```

#### documents
```
id              UUID PRIMARY KEY
org_id          UUID → organizations.id
type            TEXT (invoice/dc/quotation)
contact_id      UUID → contacts.id
total           NUMERIC
status          TEXT
created_at      TIMESTAMPTZ
```

#### payments
```
id              UUID PRIMARY KEY
org_id          UUID → organizations.id
contact_id      UUID → contacts.id
amount          NUMERIC
method          TEXT
created_at      TIMESTAMPTZ
```

#### business_connections
```
id              UUID PRIMARY KEY
requester_org_id UUID → organizations.id
receiver_org_id  UUID → organizations.id
status          TEXT (connected/pending/declined)
created_at      TIMESTAMPTZ
```

### Integration Tables (00017+)

#### api_keys
```
id              UUID PRIMARY KEY
org_id          UUID → organizations.id
key_hash        TEXT UNIQUE      # SHA-256
key_prefix      TEXT             # First 15 chars
name            TEXT
scopes          TEXT[]
last_used_at    TIMESTAMPTZ
revoked_at      TIMESTAMPTZ
created_at      TIMESTAMPTZ
```

#### external_leads
```
id              UUID PRIMARY KEY
org_id          UUID → organizations.id
source          TEXT DEFAULT 'website'
name            TEXT
phone           TEXT
email           TEXT
address         TEXT
product_interest TEXT
property_type   TEXT
bathrooms       TEXT
preferred_date  TEXT
notes           TEXT
status          TEXT DEFAULT 'new'
external_ref    TEXT UNIQUE
synced_at       TIMESTAMPTZ
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

#### sso_tokens
```
id              UUID PRIMARY KEY
org_id          UUID → organizations.id
user_id         UUID
token           TEXT UNIQUE
expires_at      TIMESTAMPTZ      # 60 seconds
used_at         TIMESTAMPTZ
created_at      TIMESTAMPTZ
```

#### warranties
```
id              UUID PRIMARY KEY
org_id          UUID → organizations.id
customer_name   TEXT
customer_phone  TEXT
product_name    TEXT
brand           TEXT
model           TEXT
serial_number   TEXT
installation_date DATE
warranty_months INTEGER
warranty_expires DATE GENERATED  # computed
amc_due_date    DATE
status          TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

#### coupons
```
id              UUID PRIMARY KEY
code            TEXT UNIQUE
discount_percent INTEGER
free_months     INTEGER
plan            TEXT
max_uses        INTEGER
used_count      INTEGER
created_for     TEXT
expires_at      TIMESTAMPTZ
created_at      TIMESTAMPTZ
```

---

## Authentication

### Methods
1. Phone OTP (via SMS)
2. Email OTP / Magic Link (via Nodemailer)
3. Email + Password

### Session Management
- Supabase Auth + @supabase/ssr
- Session stored in HTTP-only cookies
- Middleware validates session on every request

### Client Types
```typescript
// Client-side (browser components)
import { createClient } from '@/lib/supabase/browser'

// Server-side (API routes, Server Components)
import { createClient } from '@/lib/supabase/server'

// Admin operations (bypass RLS — server-only)
import { createAdminClient } from '@/lib/supabase/admin'

// External API routes (API key auth — not session)
import { validateApiKey } from '@/lib/api/validate-api-key'
```

### Route Protection
```
middleware.ts intercepts all /dashboard/* routes
→ validates Supabase session
→ redirects to /login if invalid
→ redirects to /dashboard if logged-in 
  user hits /login
```

---

## API Conventions

### Internal Routes (session auth)
```typescript
// Standard pattern for all dashboard API routes
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' }, 
      { status: 401 }
    )
  }

  // All queries auto-filtered by RLS
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
  
  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }

  return NextResponse.json({ data })
}
```

### External Routes (API key auth)
```typescript
// Pattern for all /api/external/* routes
export async function POST(req: NextRequest) {
  const auth = await validateApiKey(
    req.headers.get('x-api-key')
  )
  
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Must explicitly pass org_id — no RLS session
  const supabase = createClient()
  const { data } = await supabase
    .from('external_leads')
    .insert({ org_id: auth.org_id, ... })
}
```

### Response Shape
```typescript
// Always use these shapes:

// Success
{ data: T, message?: string }

// Success with count
{ data: T[], count: number }

// Created
{ success: true, id: string, created_at: string }

// Error
{ error: string, code?: string }
```

---

## State Management

Global state via Zustand in `src/store/useStore.ts`

Use for:
- Current user/org data
- UI state that spans multiple components
- Data that is expensive to refetch

Do NOT use Zustand for:
- Form state (use React useState)
- Server data (use Supabase directly)
- URL state (use searchParams)

---

## Component Architecture

### Hierarchy
```
Page (app/(dashboard)/feature/page.tsx)
  └── Layout (components/layout/)
       └── Feature Components
            └── Shared Components
                 └── UI Primitives (components/ui/)
```

### Naming
```
PascalCase     → Components, Types, Interfaces
camelCase      → Functions, Variables, Hooks
kebab-case     → Files, Folders, CSS classes
SCREAMING_CASE → Constants, Env vars
```

### File co-location
Feature-specific components go next to the page.
Reusable components go in components/shared/.
Primitive UI goes in components/ui/.

---

## Migration Naming

```
00000_schema.sql              # Core setup
00001_universal_schema.sql    # Main tables
00002_...
...
00017_external_integrations.sql  # Latest
00018_next_feature.sql           # Next migration
```

Always sequential. Never skip numbers.
Never modify existing migration files.
Only add new ones.

---

## Environment Variables

### Karkhana
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=https://karkhana.app

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

### Aqua Elite
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Integration
NEXT_PUBLIC_KARKHANA_URL=https://karkhana.app

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

---

## Performance Rules

1. No N+1 queries — join or batch
2. Use .select() with specific columns 
   not .select('*') on large tables
3. Add indexes for all frequently 
   queried columns
4. Use Supabase .limit() on all list queries
5. Paginate anything over 50 records
6. Images via Supabase Storage, 
   not base64 in DB

---

## Security Checklist

Before every PR:
- [ ] No sensitive data in logs
- [ ] No raw API keys stored
- [ ] Input validated before DB insert
- [ ] Auth checked before any DB operation
- [ ] org_id validated on ownership checks
- [ ] No service role key in client code
- [ ] No user input passed to raw SQL
- [ ] Rate limiting on public endpoints

---

## Prompt Template for Antigravity

Copy this exactly at the start of every prompt:

```
Read docs/00_AI_DEVELOPMENT_RULES.md, 
docs/01_KARKHANA_BLUEPRINT.md, and 
docs/02_ARCHITECTURE_GUIDE.md first.

Analyze the complete existing codebase.

Output your IMPLEMENTATION PLAN before 
writing any code.

Wait for my confirmation if there are any 
conflicts, ambiguities, or architectural 
decisions required.

Then implement: [FEATURE NAME HERE]

Follow every rule in 00_AI_DEVELOPMENT_RULES.md.
Preserve all existing functionality.
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | July 2026 | Prashanth | Initial guide |

---

*Keep this file updated with every architectural 
decision. It is the single source of truth 
for how Karkhana is built.*

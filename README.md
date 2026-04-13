# Karkhana - Universal Business OS

A modern, multi-tenant business management system built for manufacturing, trading, and service businesses. Manage orders, invoices, payments, expenses, staff, and more from a single dashboard.

## Features

- **Multi-tenant Architecture** - Isolated data per organization with RLS security
- **Order & Job Management** - Track work from receipt to completion
- **Invoicing & Billing** - Auto-generated invoices with GST support
- **Payment Tracking** - Record and track incoming payments
- **Expense Management** - Categorized expense tracking
- **Staff Management** - Track employees and attendance
- **Document Sharing** - Public share links for invoices and documents
- **Offline-First PWA** - Progressive Web App for mobile access
- **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Auth**: Supabase Auth with phone OTP
- **State**: Zustand, React Query
- **UI**: Custom components with Framer Motion animations

## Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account (free tier available at [supabase.com](https://supabase.com))
- Git

## Local Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd karkhana
npm install
```

### 2. Configure Environment Variables

Create `.env.local` with:

```env
# Supabase (from https://app.supabase.com/account/tokens)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Vercel Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

### 3. Setup Supabase Database

Run migrations in order:

```bash
# In Supabase SQL Editor, run each file:
# supabase/migrations/00000_schema.sql
# supabase/migrations/00001_universal_schema.sql
# supabase/migrations/00002_network_foundation.sql
# supabase/migrations/00003_document_branding.sql
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/              # Next.js app router pages & API routes
├── components/       # Reusable React components
├── lib/
│   ├── api/          # API client functions
│   ├── supabase/     # Supabase clients (admin, client, server)
│   ├── config/       # Business templates & constants
│   └── utils.ts      # Utilities
├── store/            # Zustand state management
├── types/            # TypeScript definitions
└── middleware.ts     # Auth middleware
```

## API Endpoints

### Data APIs

- `GET/POST /api/contacts` - Contacts/Clients/Suppliers
- `GET/POST /api/orders` - Orders/Jobs
- `GET/POST /api/invoices` - Invoices
- `GET/POST /api/payments` - Payments
- `GET/POST /api/expenses` - Expenses
- `GET/POST /api/staff` - Staff
- `GET/POST /api/attendance` - Attendance
- `GET/POST /api/inward-dcs` - Inward Delivery Chalans
- `GET/POST /api/outward-dcs` - Outward Delivery Chalans

### Utility APIs

- `GET /api/dashboard` - Dashboard metrics
- `PATCH /api/organization` - Organization settings
- `POST /api/share-links` - Create public share links

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Connect your GitHub repository
3. Set Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click Deploy

### 3. Post-Deployment

- Add your Vercel domain to Supabase Auth > Redirect URLs
- Enable custom domain (optional)
- Test authentication flow

## Available Routes

### Main Pages

- `/` - Login
- `/onboarding` - Setup wizard
- `/dashboard` - Dashboard
- `/orders` - Orders/Jobs list
- `/invoices` - Invoices list
- `/payments` - Payments recording
- `/expenses` - Expenses tracking
- `/contacts` - Clients/Suppliers
- `/staff` - Staff management
- `/finance` - Financial overview
- `/reports` - Business reports
- `/settings` - Organization settings

### DC Management

- `/dc/inward` - Inward DCs list
- `/dc/inward/new` - Create inward DC
- `/dc/outward` - Outward DCs list
- `/dc/outward/new` - Create outward DC

### Public

- `/share/[token]` - Public share links (accessible without login)

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Database Schema

Core tables:

- `organizations` - Tenant root
- `users` - Auth + roles
- `contacts` - Clients/Suppliers
- `orders` - Work units
- `documents` - DCs, quotations
- `invoices` - Billing
- `payments` - Incoming money
- `expenses` - Outgoing money
- `staff` - Employees
- `attendance` - Time tracking
- `share_links` - Public document access

## Security

- **Multi-tenant RLS** - Row-level security enforces data isolation
- **Auth Middleware** - Phone OTP authentication
- **Service Role** - Admin operations use service role (never expose key)
- **HTTPS Only** - Redirects and secure by default on Vercel

## Common Issues

### "Organization not found" error
- Ensure Supabase migrations ran successfully
- Check organization was created during onboarding

### Authentication fails
- Verify Supabase auth config in `.env.local`
- Check phone number format (should include country code)

### Deployment fails
- Review Vercel build logs
- Ensure all env vars are set
- Check Node.js version compatibility

## Configuration

### Business Templates

Edit `src/lib/config/templates.ts` to customize for different business types (Manufacturing, Auto Repair, Trading, etc.)

### Branding

Customize in Settings page:
- Primary/Secondary colors
- Document template (modern, classic, compact, industrial)
- Footer text
- Bank details, UPI ID

## Roadmap

- [ ] Advanced analytics & forecasting
- [ ] Inventory management
- [ ] Multi-currency support
- [ ] Email notifications
- [ ] API integrations (Accounting software)
- [ ] Mobile app
- [ ] Recurring invoices
- [ ] Bulk data import/export

## Support

For issues or questions:
1. Check existing documentation
2. Review database schema
3. Check Supabase dashboard for errors
4. Review environment variables

## License

Proprietary - All rights reserved

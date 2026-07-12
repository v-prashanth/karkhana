# Karkhana Master Blueprint
Version 1.0
Status: Living Document — Update with every 
major product decision.

---

## Executive Summary

Karkhana is a modular business platform that 
enables businesses of every size to establish 
their digital presence, manage daily operations, 
strengthen customer relationships, and grow 
from one unified workspace.

Philosophy: Every business deserves 
enterprise-quality tools without 
enterprise complexity.

---

## Mission

To help businesses organize, operate and grow 
through one intelligent workspace.

## Vision

To become the digital foundation for every 
growing business. Not just in India. Globally.

## North Star

Every feature must answer at least one:
1. Does it help the business earn more revenue?
2. Does it save the business owner time?
3. Does it improve the customer experience?
4. Does it make the business easier to operate?
5. Does it strengthen long-term customer retention?

If the answer to all five is no → do not build it.

---

## Core Principles

### Principle 1 — Businesses Come First
Technology is secondary.
Customers don't buy software. They buy solutions.

### Principle 2 — Simplicity Over Features
Ten features that save two hours every day 
create loyal customers.
A thousand features nobody understands 
create confusion.

### Principle 3 — Modules, Not Monoliths
A machine shop shouldn't see Salon features.
A water company shouldn't see Restaurant tables.
Every business only enables what it needs.

### Principle 4 — Progressive Complexity
A new business should feel comfortable 
within five minutes.
As the business grows, Karkhana grows with it.

### Principle 5 — Every Click Should Create Value
No unnecessary screens.
No unnecessary forms.
No unnecessary confirmations.

### Principle 6 — Data Should Never Be Entered Twice
Business Profile → Website → CRM → 
Invoices → Reports → Analytics.
One source. Many outputs.

---

## What Karkhana Is

✓ Workspace
✓ Website Platform
✓ CRM
✓ Operations Platform
✓ Customer Platform
✓ Business Profile
✓ Team Platform
✓ Growth Platform
✓ Business Network

## What Karkhana Is NOT

❌ ERP (it's a module, not the identity)
❌ Accounting Software
❌ Website Builder only
❌ CRM only
❌ Inventory Software
❌ Project Management Tool

---

## Target Customers

### Primary Industries
Service-based and project-based businesses:
- Water heating & treatment companies
- HVAC contractors
- Solar installers
- Interior design & fit-out firms
- Electrical contractors
- Plumbing businesses
- Fabrication workshops
- Precision machine shops
- Civil contractors
- Facility management companies

### Shared Workflow
All target industries share:
Lead → Site Visit → Quotation → Approval → 
Execution → Invoice → Warranty → Repeat Business

### Customer Persona
- Business Owner
- Age: 25–55
- Pain Points: Too many apps, no visibility,
  manual work, missed leads, Excel dependence,
  poor follow-ups, difficult reporting
- Needs: One place, automation, visibility, growth

---

## Business Growth Stages

### Stage 1 — Starting
One person. No website. Everything on WhatsApp.
Modules: Workspace, Business Profile, 
Customer List, Quotations, Invoices

### Stage 2 — Growing
More enquiries. Needs scale.
Modules: Website, Leads, Projects, Team

### Stage 3 — Scaling
Hiring staff.
Modules: Staff, Permissions, Inventory, Reports

### Stage 4 — Established
Multiple branches.
Modules: Dashboards, Analytics, Automation, 
Integrations

### Stage 5 — Enterprise
Multi-location, advanced permissions, 
API, AI, Partner ecosystem, Marketplace

---

## Product Modules

### Core (Always Available)
- Workspace
- Business Profile
- Authentication & Team
- Dashboard

### Module: CRM
- Contacts/Leads
- Pipeline Management
- Follow-up Reminders
- Customer History

### Module: Operations
- Job Orders
- Site Inspections
- Installations
- Service Requests

### Module: Finance
- Quotations
- Invoices (GST-compliant)
- Payments
- Expenses
- Financial Reports

### Module: Warranty & AMC
- Warranty Register
- AMC Tracking
- Service Reminders
- Renewal Management

### Module: Website
- Website Builder
- Lead Capture Forms
- SEO Management
- Content Management

### Module: Integrations
- API Key Management
- External Website Integration
- WhatsApp Business (planned)
- Payment Gateway (planned)
- Google Calendar (planned)

### Module: Network
- B2B Connections
- Purchase Orders
- Shared Documents

### Module: Staff
- Team Management
- Attendance
- Targets
- Payroll (planned)

### Module: AI (KAI)
- Business Insights
- Lead Scoring
- Workflow Suggestions
- Report Generation

---

## Integration Architecture

### Karkhana as Backend
External websites connect to Karkhana via API keys.

```
External Website
      │
      │ API Key (x-api-key header)
      ▼
Karkhana External API
      │
      ├── POST /api/external/leads
      ├── GET  /api/external/leads
      ├── GET  /api/external/verify
      ├── POST /api/external/sso
      └── GET  /api/external/products
      │
      ▼
Karkhana Database (org-isolated via RLS)
```

### SSO Flow
```
Website Admin "Open Karkhana"
      │
      ▼
POST /api/external/sso (with API key)
      │
      ▼
60-second token generated
      │
      ▼
User redirected to /auth/sso?token=...
      │
      ▼
Token validated, session created
      │
      ▼
User lands in Karkhana dashboard
(no second login required)
```

### Lead Sync Flow
```
Customer fills website form
      │
      ▼
Lead saved to website DB (always first)
      │
      ▼
Fire-and-forget: sync to Karkhana
      │
      ▼ (non-blocking)
POST /api/external/leads
      │
      ▼
Lead appears in Karkhana /leads
      │
      ▼
Business owner acts on lead
      │
      ▼
Status updates visible in both systems
```

---

## Pricing Strategy (Working)

### Starter — ₹999/month
- Leads & CRM
- Quotations & Invoices
- Payment Tracking
- 2 Team Members
- Website Integration (1 site)
- 100 leads/month

### Professional — ₹1,999/month
- Everything in Starter
- Warranty & AMC Tracking
- Installation Records
- Service Requests
- 5 Team Members
- Unlimited Leads
- WhatsApp Notifications
- Reports & Analytics

### Business — ₹3,999/month
- Everything in Professional
- Multiple Branches
- Custom Workflows
- Unlimited Team Members
- Priority Support
- Onboarding Assistance

### Website Bundle — ₹2,999/month
- Premium Website (built externally)
- Karkhana Professional
- Admin Dashboard
- Full Integration
- Monthly Maintenance

---

## Customer Zero: Aqua Elite Solutions

Aqua Elite is the first live integration.

Stack:
- Website: Next.js 14, Tailwind, Framer Motion,
  Supabase, Vercel
- Domain: aquaelitesolution.in (Hostinger)
- DNS: Cloudflare
- Email: Cloudflare Email Routing
- SMTP: Brevo/Nodemailer

Integration Flow:
Website Enquiry → Website Admin → 
Karkhana Lead → Installation → 
Warranty → AMC Reminder

Coupon: AQUAELITE2025
(100% off, 3 months, Starter plan)

---

## Go-to-Market Strategy

### Launch Stages
1. Private Alpha: 5–10 trusted businesses
2. Closed Beta: 50–100 businesses
3. Public Launch: Open registration

### Marketing Channels
- Content Marketing (primary)
- SEO (long-term)
- LinkedIn (B2B)
- Instagram (SMB owners)
- Google Ads (paid, later)
- Partner Referrals
- Customer Referrals

### Sales Strategy
- Phase 1: Founder-led sales
- Phase 2: Dedicated sales team
- Phase 3: Channel partners and resellers

### Year 1 Milestones
- First 100 businesses
- First recurring revenue
- Strong customer retention

### Year 3 Milestones
- National recognition
- Marketplace ecosystem
- AI-first workflows

### Year 5 Vision
The default operating platform for SMEs 
across multiple industries.

---

## Quality Standards

### Definition of Done
A feature is complete when:
- All planned functionality works
- TypeScript passes with no errors
- Unit tests written and passing
- API tests written and passing
- No Critical/High bugs unresolved
- Performance meets targets
- Security reviewed
- Documentation updated
- Responsive on mobile
- Existing features unaffected

### Bug Severity
- Critical: System unusable
- High: Major workflow broken
- Medium: Feature partially affected
- Low: Minor inconvenience
- Cosmetic: Visual issue

### Release Readiness
A release ships only when:
- All tests pass
- No Critical/High bugs
- Performance verified
- Security validated
- Rollback procedure verified
- Product Owner approves

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | July 2026 | Prashanth | Initial blueprint |

---

*This is a living document. Update it with every 
major product, architecture, or strategy decision. 
The blueprint is the single source of truth.*

I actually want to make one important change before we continue.

In the previous volumes, **Volume IV was "Workspace."** Since you're now asking for **Database**, I think it's a better order.

A strong architecture document should define:

> Vision → Product → Architecture → **Database** → Workspace → APIs → Modules.

That's how most large engineering teams (Stripe, Shopify, Linear, Notion) structure their documentation.

So let's make:

* **Volume IV — Database Architecture & Data Model**
* **Volume V — Workspace**
* **Volume VI — Authentication & Authorization**
* **Volume VII — APIs**
* ...

I think that's a better sequence.

---

# KARKHANA MASTER BLUEPRINT

# Version 1.0

# Volume IV — Database Architecture & Data Model

**Perspective:** CTO • Principal Database Architect • Staff Backend Engineer • Security Architect

---

# Executive Philosophy

The database is **the heart of Karkhana.**

Everything else—

* Website
* CRM
* Finance
* Inventory
* Reports
* AI
* Business Network

—is simply another way of interacting with the data.

A poorly designed database will eventually force expensive rewrites.

A well-designed database can support decades of product evolution.

Karkhana's database must be:

* Multi-tenant
* Modular
* Extensible
* Secure
* Auditable
* Performant
* AI-ready

---

# Core Principles

Every database decision follows these principles.

---

## Principle 1

### Workspace First

Nothing exists outside a Workspace.

Every major record belongs to a Workspace.

```text
Workspace

↓

Customers

Projects

Invoices

Files

Staff

Reports

Website

Products

Settings
```

Workspace is the root.

---

## Principle 2

### One Source of Truth

Information should never be duplicated.

Example

Business Name

Should exist only once.

Never:

```text
Website Table

Business Name

CRM Table

Business Name

Invoice Table

Business Name
```

Instead

```text
Organization

↓

Business Name

↓

Everything reads from Organization
```

---

## Principle 3

### Everything Has an Owner

Every record should answer:

Who created it?

Who updated it?

Which Workspace owns it?

When was it created?

---

Every table includes

```text
created_at

updated_at

created_by

updated_by
```

Almost every table includes

```text
workspace_id
```

---

## Principle 4

### Soft Deletes

Never permanently delete important business data.

Instead

```text
deleted_at

deleted_by
```

Records disappear from the UI.

But remain recoverable.

---

## Principle 5

### Auditability

Every important action must be traceable.

Example

Invoice Edited

↓

Who?

↓

When?

↓

Old Value?

↓

New Value?

---

# Database Layers

The database is divided into logical domains.

```text
Core

Identity

CRM

Operations

Finance

Website

Inventory

Staff

Network

AI

Analytics
```

Each domain owns its own tables.

---

# Core Schema

These are the foundational tables.

Everything depends on them.

---

## organizations

Represents one business.

Fields

```text
id

name

slug

industry

business_type

logo_url

email

phone

website

gst_number

address

city

state

country

timezone

currency

subscription_plan

status

created_at

updated_at
```

One organization = One Workspace.

---

## workspaces

Represents the operational environment.

Fields

```text
id

organization_id

name

settings

created_at

updated_at
```

Initially

1 Organization

↓

1 Workspace

Future

One Organization

↓

Multiple Workspaces

Example

Hyderabad Branch

Mumbai Branch

Bangalore Branch

---

## users

Managed by Supabase Auth.

Store only business metadata.

```text
id

organization_id

display_name

avatar

phone

job_title

last_login

status

created_at
```

---

## workspace_members

```text
workspace_id

user_id

role

permissions

joined_at
```

Supports

Owner

Admin

Sales

Technician

Manager

Viewer

Future custom roles.

---

# CRM Domain

---

## leads

Represents enquiries.

```text
id

workspace_id

source

status

name

company

phone

email

service_required

assigned_to

notes

created_at
```

Source examples

Website

Google

WhatsApp

Referral

Manual

Instagram

Facebook

QR Code

Business Network

---

## customers

Represents approved clients.

```text
id

workspace_id

lead_id

customer_code

billing_address

shipping_address

status

created_at
```

One lead

↓

One customer

---

## activities

Universal timeline.

Every interaction.

```text
Customer Called

Email Sent

Quotation Created

Project Started

Invoice Paid

Task Assigned
```

This becomes the business history.

---

# Operations Domain

---

## projects

Universal table.

Internally always called

Projects.

Displayed differently.

Example

Aqua Elite

↓

Installation

Machine Shop

↓

Job

HVAC

↓

Service Order

Fields

```text
id

workspace_id

customer_id

status

type

priority

assigned_to

start_date

completion_date

description
```

---

## tasks

Subtasks inside projects.

---

## visits

Site visits.

Installations.

Inspections.

---

## warranties

Tracks

Installation Date

Expiry

Service Schedule

AMC

---

# Website Domain

---

## websites

One workspace

↓

One website

```text
workspace_id

theme

domain

status

published_at
```

---

## pages

CMS.

```text
Home

About

Services

Projects

Contact

Privacy

Terms
```

---

## page_sections

Hero

Gallery

FAQ

Testimonials

Products

Everything editable.

---

## website_leads

Stores raw submissions.

Automatically becomes CRM Lead.

---

# Products

Universal.

```text
Products

Services

Categories

Images

Specifications
```

Aqua Elite

↓

Tankless Water Heater

Machine Shop

↓

CNC Component

Interior

↓

Wardrobe

Same structure.

---

# Finance

---

## quotations

---

## quotation_items

---

## invoices

---

## invoice_items

---

## payments

---

## expenses

---

## expense_categories

---

# Staff

---

## employees

---

## attendance

---

## leave_requests

---

## technician_locations

Future.

---

# Inventory

---

## inventory_items

---

## suppliers

---

## purchase_orders

---

## stock_movements

---

# Files

Universal file system.

```text
workspace_id

module

record_id

storage_path

mime_type

size

uploaded_by
```

Everything uses this.

Invoices.

Projects.

Images.

Documents.

Certificates.

---

# Notifications

```text
User

↓

Notification

↓

Read

↓

Archived
```

---

# Activity Log

Every important event.

Immutable.

Example

```text
Invoice Updated

Old Value

New Value

User

IP Address

Timestamp
```

Critical for enterprise customers.

---

# Business Network

Future.

---

## business_profiles

Public profile.

---

## referrals

Business

↓

Business

---

## partnerships

Verified relationships.

---

# AI

No AI-specific business tables.

Instead

AI reads existing data.

Additional tables

```text
ai_conversations

ai_summaries

ai_jobs

prompt_history
```

Never duplicate business information.

---

# Analytics

Never calculate expensive metrics live.

Instead

Background jobs populate

```text
daily_metrics

monthly_metrics

sales_metrics

lead_metrics

website_metrics
```

Dashboards become extremely fast.

---

# Relationships

```text
Organization

↓

Workspace

↓

Customers

↓

Projects

↓

Invoices

↓

Payments
```

Website

↓

Leads

↓

Customers

↓

Projects

Everything connects naturally.

---

# Naming Conventions

Tables

Plural.

```text
customers

projects

invoices
```

Primary Keys

```text
id
```

Foreign Keys

```text
customer_id

workspace_id

project_id
```

Timestamps

```text
created_at

updated_at
```

Boolean fields

```text
is_active

is_verified

is_archived
```

Enums are preferred for statuses to maintain consistency.

---

# Security Considerations

Every table containing tenant data must include `workspace_id` (or another tenant identifier) and be protected with **Row-Level Security (RLS)**.

Rules:

* No direct client access to unrestricted tables.
* All sensitive updates validated on the server.
* Foreign key ownership verified before inserts/updates.
* Audit logs for destructive actions.
* Sensitive fields encrypted where appropriate (e.g., API keys, OAuth tokens).

---

# Indexing Strategy

Index:

* `workspace_id`
* `customer_id`
* `project_id`
* `status`
* `created_at`
* `assigned_to`

Use composite indexes for common queries, such as:

```sql
(workspace_id, status)
(workspace_id, created_at)
(customer_id, created_at)
```

Regularly review slow queries before adding indexes to avoid unnecessary write overhead.

---

# Migration Strategy

* Never edit production tables manually.
* Every schema change is tracked through versioned migrations.
* Migrations must be reversible where practical.
* Seed scripts populate development environments with realistic sample data.

---

# Future-Proofing

The schema should be designed so that new modules (POS, HR, Marketplace, Developer APIs, AI assistants) can be added without modifying existing core tables unnecessarily.

Shared entities (Organization, Workspace, Customer, Project, Product, File) become the stable foundation that future modules build upon.

---

# Volume IV Closing Statement

The database is not merely a storage layer—it is **Karkhana's business model encoded into data structures**.

A consistent, normalized, and modular schema ensures that every feature, whether built next month or five years from now, integrates naturally into the platform. By keeping **Workspace** at the center, enforcing strong tenant isolation, and designing around shared business entities, Karkhana gains the flexibility to serve multiple industries while remaining maintainable, secure, and performant.

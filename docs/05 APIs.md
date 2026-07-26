Excellent. This is one of the most important volumes.

If the **Database is the heart**, then **APIs are the nervous system** of Karkhana.

Everything—Web, Mobile, AI, Website, Business Network, future third-party integrations—should communicate through APIs.

One thing I want to improve over a typical Next.js app:

> **Karkhana should not think in terms of "API Routes."**
>
> It should think in terms of **Business Services**.

For example:

❌ `/api/createInvoice`

Instead:

> Invoice Service
>
> * Create Invoice
> * Update Invoice
> * Cancel Invoice
> * Send Invoice
> * Mark Paid

This mindset scales much better.

---

# KARKHANA MASTER BLUEPRINT

## Version 1.0

# Volume V — API Architecture & Service Design

**Perspective:** CTO • Principal Backend Engineer • API Architect • Security Architect • Platform Engineer

---

# Executive Summary

Karkhana is an **API-first platform**.

The Web Application is merely one client.

Future clients include:

* Mobile App
* AI Assistant
* WhatsApp
* Business Network
* Public Website
* Third-party Integrations
* Partner Applications
* Desktop App
* CLI Tools
* Future Marketplace Apps

Every capability in Karkhana must be accessible through well-defined APIs.

---

# API Philosophy

APIs represent **business actions**, not database operations.

Bad

```text
POST /api/customers
```

Good

```text
Create Customer
```

Bad

```text
POST /api/project/update
```

Good

```text
Complete Installation
```

Business language.

Not developer language.

---

# API Principles

Every API follows these rules.

---

## Principle 1

Business Driven

APIs expose business operations.

Never database tables.

---

## Principle 2

Stateless

Every request contains everything needed.

No server memory.

---

## Principle 3

Versioned

Never break existing clients.

```
/api/v1/
```

Future

```
/api/v2/
```

---

## Principle 4

Consistent

Every endpoint returns identical response structure.

---

## Principle 5

Secure by Default

Every endpoint validates

Authentication

↓

Authorization

↓

Workspace

↓

Permissions

↓

Business Rules

↓

Database

---

# High-Level API Architecture

```text
Client

↓

API Gateway

↓

Authentication

↓

Authorization

↓

Validation

↓

Business Service

↓

Repository

↓

Database
```

Never

Client

↓

Database

---

# API Layers

Karkhana APIs are divided into layers.

---

## Layer 1

Authentication

Responsible for

Login

Logout

Register

Password Reset

Session

Profile

---

## Layer 2

Workspace

Business

Members

Roles

Settings

Subscription

---

## Layer 3

CRM

Leads

Customers

Activities

Notes

Tasks

Follow-ups

---

## Layer 4

Operations

Projects

Jobs

Installations

Service

Warranty

Visits

---

## Layer 5

Finance

Invoices

Payments

Quotations

Expenses

Reports

---

## Layer 6

Website

Pages

Products

SEO

Blogs

Forms

Analytics

Publishing

---

## Layer 7

Inventory

Products

Stock

Suppliers

Purchase Orders

---

## Layer 8

Business Network

Profiles

Partners

Referrals

Messages

Reviews

---

## Layer 9

AI

Assistant

Insights

Suggestions

Generation

Automation

---

# Folder Structure

```text
src/

app/

api/

v1/

auth/

workspace/

crm/

projects/

finance/

website/

inventory/

staff/

network/

ai/

shared/
```

Each domain owns its endpoints.

---

# Service Layer

The API should **never contain business logic**.

Bad

```
Route

↓

Database
```

Good

```
Route

↓

Validation

↓

Service

↓

Repository

↓

Database
```

---

Example

CustomerService

Contains

CreateCustomer()

UpdateCustomer()

ArchiveCustomer()

MergeCustomer()

ImportCustomers()

---

ProjectService

Contains

CreateProject()

AssignEngineer()

ScheduleVisit()

CompleteProject()

StartWarranty()

---

InvoiceService

Contains

GenerateInvoice()

CalculateGST()

GeneratePDF()

EmailInvoice()

MarkPaid()

---

# Repository Layer

Repositories only communicate with PostgreSQL.

They know

SQL

Indexes

Queries

Nothing else.

---

# Validation

Every endpoint uses

Zod

Example

```typescript
CreateCustomerSchema

UpdateCustomerSchema

InvoiceSchema
```

Never trust frontend validation.

Always validate again.

---

# Authentication

Initially

Supabase JWT

Future

OAuth

Enterprise SSO

API Keys

---

Every request

↓

JWT

↓

Workspace

↓

User

↓

Role

↓

Permissions

---

# Authorization

Permission example

```text
Technician

✓ View Jobs

✓ Complete Jobs

✕

Delete Invoice

✕

Manage Users
```

Permissions checked inside Service Layer.

---

# Standard Response Format

Every API should return the same structure.

Success

```json
{
  "success": true,
  "data": {},
  "message": "Customer created successfully"
}
```

Error

```json
{
  "success": false,
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "Customer not found"
  }
}
```

Never expose database errors.

---

# Pagination

Never return unlimited records.

Default

20

Maximum

100

Use cursor-based pagination for large datasets where possible to avoid performance issues.

---

# Filtering

Every list endpoint supports

Search

Status

Date

Assigned User

Sort

Page

Limit

Example

```
Customers

Status=Active

Search=Ramesh

Sort=Latest
```

---

# Upload APIs

Uploads never go through business tables.

Flow

```
Client

↓

Storage Upload

↓

Receive URL

↓

Attach URL to Record
```

Supports

Images

PDFs

Videos

Certificates

Invoices

Project Photos

---

# Public APIs

Public APIs require no login.

Examples

Business Profile

Website Pages

Public Products

Public Projects

Lead Forms

Quote Requests

Public Reviews

---

# Private APIs

Require authentication.

Examples

Dashboard

Customers

Invoices

Reports

Projects

Staff

Analytics

---

# Internal APIs

Only used by Karkhana.

Not public.

Examples

Notification Worker

Email Queue

Analytics Processor

AI Processing

Automation Engine

---

# Event APIs

Modules communicate through events rather than direct coupling.

Example

```
Lead Created

↓

Customer Module

↓

Notification Module

↓

Analytics Module

↓

Automation Module

↓

Activity Timeline
```

One action.

Many listeners.

---

# Webhooks

Future

Businesses may subscribe to events.

Example

Invoice Paid

↓

Webhook

↓

External Accounting Software

---

Supported Events

Customer Created

Invoice Paid

Lead Created

Project Completed

Warranty Expired

Employee Added

---

# Rate Limiting

Public APIs

100 requests/hour

Authenticated APIs

Based on subscription.

Enterprise

Custom.

Use Redis or an equivalent distributed cache when horizontal scaling is introduced.

---

# Caching

Cache only when appropriate.

Examples

Business Profile

Products

Public Website

Blogs

Avoid caching frequently changing operational data unless invalidation is well understood.

---

# Background Jobs

Long-running tasks should never block API responses.

Queue examples

Generate Invoice PDF

Send Email

Resize Images

Generate AI Summary

Daily Reports

Warranty Reminders

---

# API Documentation

Every endpoint should include:

* Purpose
* Authentication requirements
* Request schema
* Response schema
* Error codes
* Permission requirements
* Example requests and responses
* Rate limits

Documentation should be generated automatically from code where possible.

---

# Monitoring

Track:

* Request count
* Error rate
* Response time
* Slow endpoints
* Failed authentication
* Validation failures
* External service latency

Every request should include a correlation ID to simplify debugging across logs.

---

# Error Codes

Avoid free-form strings.

Examples

```
AUTH_INVALID_TOKEN

WORKSPACE_NOT_FOUND

CUSTOMER_ALREADY_EXISTS

PROJECT_COMPLETED

INSUFFICIENT_PERMISSION

INVALID_INPUT

RATE_LIMIT_EXCEEDED
```

These remain stable even if human-readable messages change.

---

# Future API Gateway

As Karkhana grows:

```
Cloudflare

↓

API Gateway

↓

Authentication

↓

Authorization

↓

Routing

↓

Business Services
```

This enables centralized rate limiting, logging, analytics, and future public developer APIs.

---

# API Design for Aqua Elite

The Aqua Elite website should **never access the database directly**.

Flow:

```
Website Lead Form

↓

Lead API

↓

CRM Service

↓

Lead Created

↓

Notification

↓

Activity Log

↓

Sales Dashboard Updated

↓

Follow-up Automation
```

The admin dashboard, website, and future mobile app all consume the same services, ensuring consistent business logic.

---

# API Design for the Business Network

Future partner integrations should interact only through documented APIs.

Example:

```
Business A

↓

Referral API

↓

Business B

↓

Referral Accepted

↓

Commission Recorded

↓

Notifications Sent
```

This keeps partner features decoupled from core modules.

---

# Closing Statement

The API layer is the contract between Karkhana's business capabilities and every interface that consumes them.

By keeping APIs **business-oriented, versioned, secure, and modular**, Karkhana can evolve its frontend, mobile applications, AI assistants, and partner ecosystem without rewriting its core logic. Every future feature should first be designed as a business capability exposed through a service, and only then implemented in the user interface.

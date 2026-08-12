# KARKHANA MASTER BLUEPRINT

## Version 1.0

# Volume II — Product Strategy & Product Architecture

> **Author Perspective:** CEO • CTO • Chief Product Officer • Principal Software Architect • Principal Product Designer

---

# Executive Philosophy

The biggest mistake most SaaS products make is that they start with features.

CRM.

Invoices.

Inventory.

Payroll.

HR.

Accounting.

Eventually they become complicated software that nobody enjoys using.

Karkhana will never be feature-first.

It will always be **business-first.**

We don't build software.

We build systems that help businesses grow.

Every feature exists because it solves a real business problem.

---

# Product Philosophy

Karkhana is built around one simple belief:

> **Businesses should grow naturally, and their software should grow with them.**

Software should never force businesses to change.

Software should adapt to businesses.

---

# The Karkhana Framework

Every business has the same lifecycle.

```text
Identity

↓

Customers

↓

Work

↓

Revenue

↓

Growth

↓

Expansion
```

Everything inside Karkhana supports one of these six stages.

---

# Product Pillars

These are the foundations of Karkhana.

Everything we build belongs to one of these pillars.

---

# Pillar 1

# Workspace

The Workspace is the heart of Karkhana.

Everything begins here.

A Workspace represents one business.

Example:

```
Aqua Elite Solutions

↓

Workspace
```

Inside that workspace:

Products

Customers

Projects

Invoices

Website

Staff

Reports

Settings

Everything.

---

Why Workspace?

Because businesses think:

"My Business"

Not

"My CRM"

or

"My ERP"

---

# Pillar 2

# Business Identity

Every business deserves an online identity.

Immediately after creating a Workspace, Karkhana creates:

Business Profile

Logo

Brand Colors

Business Details

Services

Contact

Address

Business Category

Gallery

Projects

Working Hours

Certificates

GST

Social Links

Everything.

No website required.

---

Public URL

```
karkhana.app/business/aquaelite
```

Immediately shareable.

---

This is important.

A website becomes optional.

A business identity becomes mandatory.

---

# Pillar 3

# Customer Growth

Businesses exist because customers exist.

Customer lifecycle:

```
Lead

↓

Enquiry

↓

Quotation

↓

Approval

↓

Project

↓

Invoice

↓

Payment

↓

Service

↓

Repeat Customer
```

Karkhana should own this entire journey.

---

# Pillar 4

# Operations

Once customers exist...

Work begins.

Operations include:

Projects

Jobs

Installations

Tasks

Service

Maintenance

Warranty

AMC

Technicians

Scheduling

Documentation

Completion

---

# Pillar 5

# Finance

Money should naturally follow operations.

Never separate.

Projects generate

↓

Invoices

↓

Payments

↓

Expenses

↓

Reports

↓

Profit

---

# Pillar 6

# Growth

This is what differentiates Karkhana.

Growth includes:

Website

SEO

Reviews

Referrals

Analytics

Partner Network

Repeat Customers

Marketing

---

Software shouldn't stop after invoicing.

It should help businesses grow.

---

# The Modular Philosophy

Karkhana is NOT a monolith.

Every feature is a module.

Modules can be enabled.

Disabled.

Hidden.

Installed.

---

Example

Aqua Elite

```
Workspace

├── Website

├── CRM

├── Quotations

├── Installations

├── Warranty

├── Reports
```

Machine Shop

```
Workspace

├── CRM

├── Jobs

├── Delivery Challans

├── Inventory

├── Invoices
```

Restaurant

```
Workspace

├── POS

├── Tables

├── Kitchen

├── Staff
```

Same platform.

Different experience.

---

# Industry Templates

Instead of installing modules manually...

User chooses business type.

```
Create Workspace

↓

What do you do?

○ Water Solutions

○ HVAC

○ Solar

○ Interior

○ Manufacturing

○ Electrical

○ Plumbing

○ General Services
```

Karkhana automatically enables the right modules.

---

# Dynamic Terminology

This is one of the biggest differentiators.

Internally

Everything is called

Projects.

Externally

Different industries see different labels.

Example:

Water Company

Projects

↓

Installations

Machine Shop

Projects

↓

Jobs

Construction

Projects

↓

Sites

Interior Design

Projects

↓

Projects

HVAC

Projects

↓

Service Orders

Same database.

Different language.

Customers feel

"This software understands my business."

---

# Website Strategy

The website is NOT the product.

The website is one module.

Businesses should have two options.

---

Option 1

No website.

Business Profile only.

---

Option 2

Enable Website.

Immediately:

Business Profile

↓

Website

↓

SEO

↓

Lead Forms

↓

Analytics

↓

Blog

↓

Projects

Everything synced.

---

One source of truth.

---

# Business Profile

Every workspace automatically gets:

Business Name

Logo

Description

Location

Products

Services

Projects

Gallery

Contact

Email

Phone

Business Hours

Certificates

Social Links

Reviews

Google Map

Everything.

This profile becomes:

Public

Searchable

Professional

---

# Website Builder

Future.

Website Builder should NEVER feel like WordPress.

Instead

Website

↓

Theme

↓

Automatically generated pages

↓

Editable sections

↓

Publish

Business owner should never drag and drop boxes.

---

# Lead Philosophy

Leads can come from anywhere.

Website

Google

WhatsApp

Phone

Walk-in

Facebook

Instagram

Referral

Manual Entry

QR Code

Network

Everything becomes

Lead.

---

Every Lead

↓

Customer

↓

Forever.

---

# CRM Philosophy

CRM should be invisible.

Business owner shouldn't think

"I'm updating CRM."

Instead

"I'm talking to a customer."

CRM updates automatically.

Calls

Notes

Quotations

Tasks

Emails

Everything attached.

---

# Projects Philosophy

Projects are the center.

Everything connects.

```
Project

↓

Customer

↓

Quotation

↓

Invoice

↓

Payments

↓

Staff

↓

Tasks

↓

Files

↓

Warranty
```

Everything.

---

# Business Network

Eventually...

Businesses should help businesses.

Imagine

Aqua Elite

Needs

Electrician

↓

Search Network

↓

Nearby Verified Partner

↓

Assign

↓

Review

↓

Earn Referral

That's real value.

---

# Multi-Tenant Strategy

Every Workspace is isolated.

```
Workspace A

Customers

Projects

Invoices

Staff

Files

↓

Workspace B

Customers

Projects

Invoices

Staff
```

No shared data.

Perfect isolation.

---

# Permissions

Owner

Admin

Manager

Technician

Sales

Accountant

Viewer

Custom Roles

Future

Granular Permissions.

---

# Product Evolution

Karkhana grows with business.

---

Stage 1

Workspace

Business Profile

Customers

Invoices

---

Stage 2

Website

Projects

Leads

Reports

---

Stage 3

Staff

Inventory

Permissions

Automation

---

Stage 4

AI

Analytics

API

Partner Network

---

Stage 5

Marketplace

Developers

Extensions

App Store

---

# Pricing Philosophy

Never charge for features.

Charge for business growth.

Example:

Free

Workspace

Business Profile

Customers

Basic Invoices

Starter

Website

CRM

Projects

Reports

Growth

Staff

Automation

Warranty

Inventory

Professional

Multi Branch

Advanced Analytics

API

Enterprise

Custom

SSO

Dedicated Support

Private Hosting

---

# Customer Zero Strategy

The first real implementation is Aqua Elite.

Not because it is perfect.

Because it proves the entire lifecycle.

Website

↓

Lead

↓

CRM

↓

Quotation

↓

Installation

↓

Invoice

↓

Warranty

↓

AMC

↓

Repeat Customer

Once this works, the same workflow can be adapted to other service businesses with minimal changes.

---

# Decision Framework

Every proposed feature must pass these questions:

1. Does it solve a real business problem?
2. Can a business owner understand it without training?
3. Does it reduce manual work?
4. Does it integrate naturally with existing workflows?
5. Can it scale across multiple industries?
6. Will it still make sense five years from now?

If the answer to any of these is "no," the feature should be reconsidered or postponed.

---

# Strategic Wedge: The Job Work Material Liability Tracker

### Market Reality & Competitive Landscape
- **Tally Prime**: Has job work module, but desktop-only, complex UX, no native WhatsApp, ₹18,000/yr, requires trained accountant.
- **ERPNext**: Open source, but overwhelming setup, non-India UX, requires IT team.
- **Paper / Memory**: Current reality for 80%+ of Indian MSME job shops.

### Karkhana's Differentiator
Karkhana introduces the **Material Liability Tracker (CGST Sec 143 1-Year Rule)**:
1. **Zero-Training Mobile UX**: Native WhatsApp notifications and big-button mobile interface.
2. **Dual-Side Network Model**: Principal and Job Worker share the exact same ledger view automatically.
3. **Automated Risk Mitigation**: 90-day, 30-day, and 7-day countdown alerts before principal incurs forced GST liability.

---

# Volume II Closing Statement

Karkhana is not trying to replace every business application.

It is building a **connected ecosystem** where businesses start with a single workspace and expand as they grow.

A plumber, a water heating company, a fabrication workshop, or an interior designer should all feel that Karkhana was built specifically for them—even though they're using the same platform.

The product architecture is therefore based on **shared capabilities with industry-specific experiences**, allowing Karkhana to remain focused, scalable, and adaptable without becoming a bloated, one-size-fits-all ERP.

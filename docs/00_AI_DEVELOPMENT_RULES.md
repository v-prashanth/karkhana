# Karkhana — AI Development Rules
Version 1.0
Last Updated: July 2026

## CRITICAL: Read this before writing a single line of code.

You are NOT starting a new project.
You are continuing development of an existing 
production-grade platform.

---

## RULE 1 — Understand Before You Build

Before any implementation:

1. Read this entire file
2. Read docs/01_KARKHANA_BLUEPRINT.md
3. Read docs/02_ARCHITECTURE_GUIDE.md
4. List every file in the project
5. Read every existing:
   - API route
   - Database migration
   - Component
   - Hook
   - Utility
   - Type definition
   - Environment variable

Do not assume. Verify.

---

## RULE 2 — Never Duplicate

Before creating any file, component, hook, 
utility, or API route:

Search for an existing one that does the same thing.

If it exists → use it.
If it's close → extend it.
Only if nothing exists → create new.

---

## RULE 3 — Preserve Everything

This platform works in production.

Do NOT:
- Rewrite working modules
- Rename files without reason
- Change existing API contracts
- Replace working components
- Redesign existing pages
- Modify database columns that exist
- Change authentication flows
- Alter RLS policies without explicit instruction

Every change must be backwards compatible.

---

## RULE 4 — Follow Existing Conventions

Read the existing code and match:
- File naming (kebab-case, PascalCase components)
- Folder structure (feature-based)
- Import style (absolute @/ paths)
- TypeScript strictness
- Tailwind class ordering
- Error handling patterns
- API response shape
- Supabase query style
- Component composition patterns

Do not introduce new patterns unless explicitly 
requested and architecturally justified.

---

## RULE 5 — Architecture First

Before writing code, output:

```
IMPLEMENTATION PLAN
═══════════════════
Files to CREATE:
- [list each file]

Files to MODIFY:
- [list each file and what changes]

Database changes required:
- [migration file name and what it adds]

Existing components to REUSE:
- [list each]

Potential conflicts with existing code:
- [list any]

Questions before proceeding:
- [list any ambiguities]
```

Wait for confirmation if there are conflicts or 
ambiguities before proceeding.

---

## RULE 6 — Production Quality Only

Every line of code must be production-ready.

No:
- Placeholder comments (// TODO, // FIXME)
- Mock data in production code
- console.log statements (use proper logging)
- Unused imports
- Unused variables
- Any type (use proper TypeScript types)
- Hardcoded strings that should be constants
- Hardcoded URLs that should be env vars
- Unhandled promise rejections
- Missing error boundaries
- Missing loading states
- Missing empty states

---

## RULE 7 — Database Rules

Every migration file:
- Is named sequentially (00018_feature_name.sql)
- Includes IF NOT EXISTS on all CREATE statements
- Includes RLS policies using get_current_org_id()
- Includes indexes for all foreign keys
- Includes updated_at triggers where needed
- Includes ON CONFLICT handling for seed data
- Is never destructive without explicit instruction

Never:
- Drop existing columns
- Rename existing columns
- Change existing column types
- Remove existing RLS policies
- Modify existing indexes

---

## RULE 8 — API Rules

Every API route:
- Validates authentication first
- Validates input before DB operations
- Returns consistent error shape:
  { error: string, code?: string }
- Returns consistent success shape:
  { data?: any, message?: string }
- Handles all error cases explicitly
- Never exposes internal error details
  to the client
- Uses appropriate HTTP status codes:
  200 OK, 201 Created, 400 Bad Request,
  401 Unauthorized, 403 Forbidden,
  404 Not Found, 500 Internal Server Error

---

## RULE 9 — Security Rules

Never:
- Log sensitive data (keys, passwords, tokens)
- Store raw API keys (hash with SHA-256)
- Expose service role key to client
- Trust user input without validation
- Skip authorization checks
- Return stack traces to client
- Use Math.random() for security tokens
  (use crypto.randomBytes())

Always:
- Validate org ownership on every DB operation
- Use parameterized queries (Supabase handles this)
- Rate limit sensitive endpoints
- Sanitize user input

---

## RULE 10 — Testing Rules

Every feature must include:
- Unit tests for business logic functions
- API route tests for all endpoints
- Integration tests for critical workflows
- TypeScript types for all data shapes

Test files go in:
__tests__/unit/
__tests__/integration/
__tests__/e2e/

---

## RULE 11 — Component Rules

Before creating a UI component:
1. Check src/components/ui/ for existing primitives
2. Check src/components/shared/ for shared patterns
3. Check the relevant feature folder

Components must:
- Be fully typed with TypeScript
- Handle loading state
- Handle error state  
- Handle empty state
- Be responsive (mobile-first)
- Follow existing design tokens
- Use existing Tailwind color classes

---

## RULE 12 — The North Star Check

Before implementing any feature, ask:

Does this help the business earn more revenue?
Does this save the business owner time?
Does this improve the customer experience?
Does this make the business easier to operate?
Does this strengthen long-term customer retention?

If the answer to all five is no, do not build it.

---

## HOW TO USE THIS FILE

Every Antigravity prompt begins with:

"Read docs/00_AI_DEVELOPMENT_RULES.md, 
docs/01_KARKHANA_BLUEPRINT.md, and 
docs/02_ARCHITECTURE_GUIDE.md.

Analyze the existing codebase completely.

Then output your IMPLEMENTATION PLAN.

Wait for confirmation before writing any code.

Then implement: [YOUR FEATURE HERE]"

---

## VIOLATION CONSEQUENCES

If any rule is violated:
- Stop immediately
- Revert the change
- Explain what went wrong
- Propose the correct approach
- Wait for approval

Shipping broken code is worse than shipping 
no code.

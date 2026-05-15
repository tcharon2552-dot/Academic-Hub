# Academic Hub MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first web MVP for Academic Hub: a China-focused research AI subscription service with tiered plans, quota accounting, core research workflows, New API gateway integration, domestic payment placeholders, and admin review flows.

**Architecture:** Use a Next.js full-stack app as the product layer, PostgreSQL + Prisma for persistence, New API as the model gateway, and a workflow service layer that exposes research tasks instead of raw model access. The MVP is web-first and keeps B2/B3 and crypto payment behind application/manual-review flows.

**Tech Stack:** Next.js App Router, TypeScript, React, Tailwind CSS, Prisma, PostgreSQL, Vitest, Playwright, Zod, pnpm.

---

## Scope Boundary

The product spec covers several independent subsystems. This plan implements the Phase 1 MVP foundation:

- Public marketing and pricing pages
- Email/password or magic-link auth scaffold
- Subscription tier catalog and quota model
- User dashboard
- PDF upload metadata and basic paper reader workflow
- Writing polish workflow
- Literature review workflow shell
- New API proxy client and usage ledger
- B2/B3 application workflow
- Manual bank-transfer payment workflow
- Domestic payment provider adapter interface
- Admin operations dashboard

Out of scope for this plan:

- Production WeChat Pay/Alipay certification
- Crypto payment implementation
- SSO
- Private deployment
- Full invoice automation
- Full OCR-quality PDF parsing beyond MVP text extraction
- Public API access

## File Structure

Create the app from an empty repository with this structure:

```text
.
├── README.md
├── docs/
│   ├── product/research-ai-subscription-design.md
│   └── superpowers/plans/2026-05-15-academic-hub-mvp.md
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── pricing/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── workflows/paper-reader/page.tsx
│   │   ├── workflows/writing-polish/page.tsx
│   │   ├── workflows/literature-review/page.tsx
│   │   ├── team/page.tsx
│   │   ├── apply/team/page.tsx
│   │   ├── billing/page.tsx
│   │   ├── admin/page.tsx
│   │   └── api/
│   │       ├── auth/register/route.ts
│   │       ├── billing/checkout/route.ts
│   │       ├── applications/team/route.ts
│   │       ├── workflows/paper-reader/route.ts
│   │       ├── workflows/writing-polish/route.ts
│   │       ├── workflows/literature-review/route.ts
│   │       └── admin/applications/[id]/route.ts
│   ├── components/
│   │   ├── app-shell.tsx
│   │   ├── plan-card.tsx
│   │   ├── quota-meter.tsx
│   │   ├── workflow-card.tsx
│   │   ├── upload-dropzone.tsx
│   │   └── admin-table.tsx
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── env.ts
│   │   ├── plans.ts
│   │   ├── quota.ts
│   │   ├── new-api.ts
│   │   ├── payments.ts
│   │   ├── workflows/
│   │   │   ├── paper-reader.ts
│   │   │   ├── writing-polish.ts
│   │   │   └── literature-review.ts
│   │   └── validators/
│   │       ├── application.ts
│   │       ├── billing.ts
│   │       └── workflows.ts
│   └── styles/globals.css
├── tests/
│   ├── unit/plans.test.ts
│   ├── unit/quota.test.ts
│   ├── unit/new-api.test.ts
│   ├── unit/payments.test.ts
│   ├── integration/workflows.test.ts
│   └── e2e/pricing-to-dashboard.spec.ts
└── .env.example
```

## Data Model

Use Prisma models for:

- `User`: account identity and role.
- `Plan`: A0/A1/A2/A3/B1/B2/B3 tier definitions.
- `Subscription`: current user or team plan.
- `QuotaLedger`: credit grants, consumption, add-ons, and adjustments.
- `Team`: B-plan workspace.
- `TeamMember`: membership and role.
- `Document`: uploaded PDF metadata and extracted text status.
- `WorkflowRun`: paper reader, writing polish, and literature review job history.
- `UsageRecord`: model request usage returned from New API.
- `PaymentOrder`: domestic payment, bank transfer, manual, and future crypto-compatible records.
- `TeamApplication`: B2/B3 application form and admin decision.

## Task 1: Scaffold Next.js App and Tooling

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/styles/globals.css`
- Create: `.env.example`

- [ ] **Step 1: Create package and scripts**

Create `package.json` with scripts:

```json
{
  "name": "academic-hub",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^6.0.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "prisma": "^6.0.0",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
pnpm install
```

Expected: `pnpm-lock.yaml` is created and install completes without errors.

- [ ] **Step 3: Create base app shell**

Implement `src/app/layout.tsx`, `src/app/page.tsx`, and `src/styles/globals.css` with a minimal Academic Hub landing page that links to pricing and dashboard.

- [ ] **Step 4: Verify scaffold**

Run:

```bash
pnpm typecheck
pnpm build
```

Expected: both commands pass.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml next.config.ts tsconfig.json tailwind.config.ts postcss.config.mjs src .env.example
git commit -m "chore: scaffold academic hub app"
```

## Task 2: Define Plan Catalog and Pricing UI

**Files:**
- Create: `src/lib/plans.ts`
- Create: `src/components/plan-card.tsx`
- Create: `src/app/pricing/page.tsx`
- Test: `tests/unit/plans.test.ts`

- [ ] **Step 1: Write plan catalog tests**

Create tests asserting:

- A0, A1, A2, A3, B1, B2, B3 exist.
- A0 has free signup credits.
- A1/A2/A3/B1 are self-serve.
- B2/B3 require application.
- No tier is marked unlimited.

Run:

```bash
pnpm test tests/unit/plans.test.ts
```

Expected: fail because `src/lib/plans.ts` does not exist.

- [ ] **Step 2: Implement plan catalog**

Create `src/lib/plans.ts` exporting:

- `PlanCode`
- `PlanAudience`
- `PlanAccessMode`
- `PLAN_CATALOG`
- `getPlanByCode(code)`
- `getPublicPlans()`

Use the pricing ranges from the product design.

- [ ] **Step 3: Build pricing components**

Create `PlanCard` and `src/app/pricing/page.tsx` showing:

- A0 registration credits
- A1/A2/A3 self-serve buttons
- B1 self-serve button
- B2/B3 application buttons
- Add-on package section

- [ ] **Step 4: Verify tests and page build**

Run:

```bash
pnpm test tests/unit/plans.test.ts
pnpm build
```

Expected: tests and build pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/plans.ts src/components/plan-card.tsx src/app/pricing/page.tsx tests/unit/plans.test.ts
git commit -m "feat: add subscription plan catalog"
```

## Task 3: Add Database Schema and Seed Data

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/db.ts`
- Modify: `.env.example`

- [ ] **Step 1: Define Prisma schema**

Create models listed in the Data Model section. Use enums for:

- `PlanCode`
- `SubscriptionStatus`
- `QuotaEventType`
- `WorkflowType`
- `PaymentMethod`
- `PaymentStatus`
- `ApplicationStatus`

- [ ] **Step 2: Add database environment variables**

Update `.env.example`:

```bash
DATABASE_URL="postgresql://academic_hub:academic_hub@localhost:5432/academic_hub"
NEW_API_BASE_URL="https://new-api.example.com"
NEW_API_KEY="replace-me"
APP_BASE_URL="http://localhost:3000"
```

- [ ] **Step 3: Implement Prisma client**

Create `src/lib/db.ts` with a singleton Prisma client for Next.js development.

- [ ] **Step 4: Seed plan data**

Create `prisma/seed.ts` that upserts all seven plans and their quota defaults from `PLAN_CATALOG`.

- [ ] **Step 5: Verify migration**

Run with a local PostgreSQL database:

```bash
pnpm prisma:generate
pnpm prisma:migrate --name init
pnpm prisma:seed
```

Expected: migration succeeds and plans exist in the database.

- [ ] **Step 6: Commit**

```bash
git add prisma src/lib/db.ts .env.example
git commit -m "feat: add database schema and seed data"
```

## Task 4: Implement Quota Ledger

**Files:**
- Create: `src/lib/quota.ts`
- Create: `src/components/quota-meter.tsx`
- Test: `tests/unit/quota.test.ts`

- [ ] **Step 1: Write quota tests**

Test these behaviors:

- A0 grants signup credits.
- Consuming a task creates a debit event.
- Consumption is rejected when quota is insufficient.
- Add-on grants increase available quota.
- Advanced model credits are tracked separately from general research task credits.

- [ ] **Step 2: Implement quota service**

Create functions:

- `grantSignupCredits(userId)`
- `getQuotaBalance(ownerId, quotaType)`
- `consumeQuota(ownerId, quotaType, amount, metadata)`
- `grantAddOnQuota(ownerId, quotaType, amount, expiresAt)`

Use database transactions for consume operations.

- [ ] **Step 3: Implement quota meter UI**

Create a small component that displays available research task credits, advanced model credits, and long document credits.

- [ ] **Step 4: Verify**

Run:

```bash
pnpm test tests/unit/quota.test.ts
pnpm typecheck
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/quota.ts src/components/quota-meter.tsx tests/unit/quota.test.ts
git commit -m "feat: add quota ledger"
```

## Task 5: Add Basic Auth and A0 Registration Credits

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/register/route.ts`
- Modify: `src/app/dashboard/page.tsx`
- Test: `tests/integration/workflows.test.ts`

- [ ] **Step 1: Write registration integration test**

Test that registering a user creates:

- `User`
- A0 `Subscription`
- Signup quota ledger grant

- [ ] **Step 2: Implement auth scaffold**

For MVP, implement email-based registration with a development-only session cookie. Defer production auth provider selection.

- [ ] **Step 3: Implement dashboard**

Dashboard should show:

- Current plan
- Quota meters
- Workflow entry cards
- Upgrade prompts when quota is low

- [ ] **Step 4: Verify**

Run:

```bash
pnpm test tests/integration/workflows.test.ts
pnpm build
```

Expected: registration test passes and dashboard builds.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/register/route.ts src/app/dashboard/page.tsx tests/integration/workflows.test.ts
git commit -m "feat: add registration and free credits"
```

## Task 6: Implement New API Client

**Files:**
- Create: `src/lib/env.ts`
- Create: `src/lib/new-api.ts`
- Test: `tests/unit/new-api.test.ts`

- [ ] **Step 1: Write New API client tests**

Test:

- Missing env vars fail fast with clear messages.
- Chat completion request maps workflow metadata into the request.
- Usage response is normalized into prompt, completion, and total tokens.
- HTTP errors return actionable error types.

- [ ] **Step 2: Implement env validation**

Use Zod in `src/lib/env.ts` to validate:

- `DATABASE_URL`
- `NEW_API_BASE_URL`
- `NEW_API_KEY`
- `APP_BASE_URL`

- [ ] **Step 3: Implement New API client**

Create:

- `callResearchModel(input)`
- `normalizeUsage(response)`
- `NewApiError`

Use OpenAI-compatible chat completions for MVP. Keep the client isolated so it can later move to Responses API or provider-specific routes.

- [ ] **Step 4: Verify**

Run:

```bash
pnpm test tests/unit/new-api.test.ts
pnpm typecheck
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/env.ts src/lib/new-api.ts tests/unit/new-api.test.ts
git commit -m "feat: add new api client"
```

## Task 7: Add Research Workflows

**Files:**
- Create: `src/lib/workflows/paper-reader.ts`
- Create: `src/lib/workflows/writing-polish.ts`
- Create: `src/lib/workflows/literature-review.ts`
- Create: `src/lib/validators/workflows.ts`
- Create: `src/app/api/workflows/paper-reader/route.ts`
- Create: `src/app/api/workflows/writing-polish/route.ts`
- Create: `src/app/api/workflows/literature-review/route.ts`
- Create: workflow pages under `src/app/workflows/*/page.tsx`
- Test: `tests/integration/workflows.test.ts`

- [ ] **Step 1: Write workflow tests**

Test:

- Paper reader consumes paper reading quota.
- Writing polish consumes general research task quota.
- Literature review rejects A0/A1 users when batch quota is unavailable.
- Workflow run records status, input summary, output summary, and usage.

- [ ] **Step 2: Implement validators**

Use Zod schemas for:

- Paper reader input
- Writing polish input
- Literature review input

- [ ] **Step 3: Implement workflow services**

Each service should:

- Validate input.
- Check quota.
- Build a workflow-specific prompt.
- Call New API client.
- Record `WorkflowRun`.
- Record `UsageRecord`.
- Consume quota.
- Return user-facing output.

- [ ] **Step 4: Implement workflow pages**

Create simple forms for:

- PDF/text paste for paper reader MVP
- Academic paragraph polish
- Multi-paper abstract paste for literature review

- [ ] **Step 5: Verify**

Run:

```bash
pnpm test tests/integration/workflows.test.ts
pnpm build
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/workflows src/lib/validators/workflows.ts src/app/api/workflows src/app/workflows tests/integration/workflows.test.ts
git commit -m "feat: add research workflow services"
```

## Task 8: Add Team Application and B-Plan Flow

**Files:**
- Create: `src/lib/validators/application.ts`
- Create: `src/app/apply/team/page.tsx`
- Create: `src/app/api/applications/team/route.ts`
- Create: `src/app/team/page.tsx`
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Write application tests**

Test:

- B2/B3 application requires lab name, contact, member count, use case, and payment preference.
- B1 can be self-serve.
- Admin can approve or reject applications.

- [ ] **Step 2: Implement application form**

Form fields:

- Applicant name
- Email
- Institution
- Lab/team name
- Desired plan: B2 or B3
- Expected member count
- Main use case
- Invoice/contract requirement
- Bank transfer preference

- [ ] **Step 3: Implement application API**

Persist `TeamApplication` with `pending` status.

- [ ] **Step 4: Implement admin review actions**

Admin can:

- Approve
- Reject
- Mark as contacted

- [ ] **Step 5: Verify**

Run:

```bash
pnpm test
pnpm build
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/validators/application.ts src/app/apply src/app/api/applications src/app/team src/app/admin tests
git commit -m "feat: add team application workflow"
```

## Task 9: Add Billing and Payment Abstractions

**Files:**
- Create: `src/lib/payments.ts`
- Create: `src/lib/validators/billing.ts`
- Create: `src/app/api/billing/checkout/route.ts`
- Create: `src/app/billing/page.tsx`
- Test: `tests/unit/payments.test.ts`

- [ ] **Step 1: Write payment tests**

Test:

- A1/A2/A3/B1 create self-serve checkout orders.
- B2/B3 checkout is rejected and points to application flow.
- Bank transfer orders can be created for team plans.
- Crypto payment method is disabled by default.

- [ ] **Step 2: Implement payment provider interface**

Create:

- `PaymentProvider`
- `ManualBankTransferProvider`
- `DisabledCryptoProvider`
- `createCheckoutOrder(input)`

- [ ] **Step 3: Implement checkout API**

Rules:

- Self-serve plans create `PaymentOrder`.
- B2/B3 return an application-required response.
- Crypto method returns disabled response unless `ENABLE_CRYPTO_PAYMENTS=true`.

- [ ] **Step 4: Implement billing page**

Show:

- Current subscription
- Payment orders
- Bank transfer instructions for team orders
- Add-on package entry points

- [ ] **Step 5: Verify**

Run:

```bash
pnpm test tests/unit/payments.test.ts
pnpm build
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/payments.ts src/lib/validators/billing.ts src/app/api/billing src/app/billing tests/unit/payments.test.ts
git commit -m "feat: add billing abstractions"
```

## Task 10: Add Admin Operations Dashboard

**Files:**
- Create: `src/components/admin-table.tsx`
- Modify: `src/app/admin/page.tsx`
- Create: `src/app/api/admin/applications/[id]/route.ts`

- [ ] **Step 1: Implement admin tables**

Show:

- Pending B2/B3 applications
- Recent payment orders
- Heavy usage users
- Recent workflow runs

- [ ] **Step 2: Implement admin application actions**

API supports:

- `approve`
- `reject`
- `mark_contacted`

- [ ] **Step 3: Add basic role guard**

Only users with `admin` role can access admin routes.

- [ ] **Step 4: Verify**

Run:

```bash
pnpm typecheck
pnpm build
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin-table.tsx src/app/admin src/app/api/admin
git commit -m "feat: add admin operations dashboard"
```

## Task 11: Add E2E Conversion Flow

**Files:**
- Create: `tests/e2e/pricing-to-dashboard.spec.ts`
- Create: `playwright.config.ts`

- [ ] **Step 1: Write e2e test**

Cover:

1. Visitor lands on home page.
2. Visitor opens pricing.
3. Visitor sees A1/A2/A3/B1 self-serve and B2/B3 application.
4. Visitor registers.
5. Visitor reaches dashboard with A0 credits.
6. Visitor opens writing polish workflow.

- [ ] **Step 2: Run e2e test**

Run:

```bash
pnpm test:e2e
```

Expected: pass locally.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/pricing-to-dashboard.spec.ts playwright.config.ts
git commit -m "test: add pricing conversion e2e flow"
```

## Task 12: Documentation and Launch Checklist

**Files:**
- Modify: `README.md`
- Create: `docs/ops/mvp-launch-checklist.md`
- Create: `docs/ops/payment-compliance-notes.md`

- [ ] **Step 1: Update README**

Add:

- Local development setup
- Environment variables
- Database setup
- Test commands
- Deployment notes

- [ ] **Step 2: Add launch checklist**

Include:

- Payment provider account
- New API endpoint and key
- Model channel configuration
- Quota defaults
- Admin user setup
- Backup and logging
- Terms/privacy review

- [ ] **Step 3: Add payment compliance notes**

Document:

- Domestic payment is P0.
- Crypto payment is disabled by default.
- Crypto payment requires legal review and separate operational controls.

- [ ] **Step 4: Final verification**

Run:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
git status --short
```

Expected: all checks pass and no uncommitted changes remain after final commit.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/ops
git commit -m "docs: add mvp launch checklist"
```

## Task 13: Push and Remote Verification

**Files:**
- No file changes.

- [ ] **Step 1: Push branch**

Run:

```bash
git push
```

Expected: local `main` pushes to `origin/main`.

- [ ] **Step 2: Verify remote**

Run:

```bash
git ls-remote --heads origin main
git status --short --branch
```

Expected:

- `origin/main` points to the final commit.
- Local branch is clean and tracking `origin/main`.

## Self-Review Notes

Spec coverage:

- Subscription tiers: Tasks 2, 3, 4, 9.
- Free credits: Tasks 4 and 5.
- Research workflows: Task 7.
- New API mapping: Tasks 3, 6, 7.
- B2/B3 applications: Tasks 2, 8, 10.
- Payment strategy: Task 9 and Task 12.
- Admin operations: Task 10.
- MVP launch controls: Task 12.

Known implementation dependency:

- The repository is currently documentation-only. Task 1 creates the application foundation before any feature implementation.

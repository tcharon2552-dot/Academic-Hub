# MVP Launch Checklist

Use this checklist before opening Academic Hub to real researchers or lab teams.

## Product Scope

- Confirm A0 free credits, A1/A2/A3 individual plans, B1 self-serve team plan, and B2/B3 application flows are visible in pricing.
- Confirm the public positioning describes research workflows, not API resale or a generic model relay.
- Confirm free-credit exhaustion, low quota, and upgrade prompts route users toward A1/A2/A3/B1 or the B2/B3 application form.

## New API Gateway

- Set `NEW_API_BASE_URL` and `NEW_API_KEY` in the production environment.
- Configure model channels for one high-quality frontier model, one lower-cost domestic model, and any embedding or rerank model used by research workflows.
- Map workflow types to approved model channels and cost tiers.
- Confirm New API returns usage data and that usage records are stored for workflow runs.
- Set alerting for failed model calls, token spikes, and abnormal owner-level usage.

## Quota and Plans

- Review seeded plan defaults for A0/A1/A2/A3/B1/B2/B3.
- Confirm A0 signup credits are granted once per user.
- Confirm quota ledgers record grants, consumption, add-ons, and manual adjustments.
- Set operating thresholds for low quota, heavy usage owners, and advanced model credit exhaustion.
- Define manual quota grant policy for support, refunds, and B2/B3 sales commitments.

## Payment Operations

- Open and verify at least one domestic payment provider account that supports WeChat Pay or Alipay.
- Keep bank transfer available for B plans, with manual finance review before activation.
- Confirm payment orders store provider, method, amount, owner, status, and reconciliation metadata.
- Define invoice handling for B1 and contract/invoice handling for B2/B3.
- Keep crypto payment disabled unless the separate compliance review in `payment-compliance-notes.md` is complete.

## Admin Setup

- Create the first `ADMIN` user directly in the database before exposing `/admin`.
- Confirm non-admin users cannot access `/admin` or admin APIs.
- Verify pending B2/B3 applications, recent payment orders, heavy usage owners, and recent workflow runs render in the admin dashboard.
- Define who can approve applications, adjust quota, confirm bank transfers, and handle refunds.

## Data, Backup, and Logging

- Enable PostgreSQL backups with a tested restore path.
- Log registration, payment order creation, workflow run failures, New API errors, and admin decisions.
- Retain enough payment and usage records for reconciliation and support investigations.
- Define deletion handling for uploaded research documents before broad launch.
- Confirm secrets are stored in the deployment provider, not committed to the repository.

## Legal and Policy Review

- Publish terms of service and privacy policy before collecting real user data.
- Review uploaded document handling, retention, and deletion expectations.
- Review China-facing payment, invoicing, refund, and customer support obligations.
- Review all public copy so crypto payment is not marketed to mainland China users.

## Release Verification

Run these checks from a clean checkout:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Before launch, also run a smoke test against the deployed environment:

- Register a new A0 user.
- Open pricing and confirm all tiers.
- Run at least one writing polish workflow through New API.
- Create a domestic payment order in test mode.
- Submit one B2/B3 application and review it in admin.

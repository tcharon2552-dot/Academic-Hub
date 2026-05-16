# Academic Hub

Academic Hub is a vertical AI subscription service for researchers and labs. It uses New API as the backend model gateway, but the user-facing product is positioned around research workflows rather than generic API relay access.

Core MVP workflows:

- Paper reading
- Literature review
- Academic writing
- Reviewer response drafting
- Research code and data analysis
- Lab collaboration

## Product Documents

- [Research AI Subscription Service Design](docs/product/research-ai-subscription-design.md)
- [MVP Launch Checklist](docs/ops/mvp-launch-checklist.md)
- [Payment Compliance Notes](docs/ops/payment-compliance-notes.md)

## Local Development

Prerequisites:

- Node.js 20+
- pnpm via Corepack
- Docker, if you want the included local PostgreSQL service

Install dependencies:

```bash
corepack enable
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Start local PostgreSQL:

```bash
docker compose up -d db
```

Prepare the database:

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

Run the app:

```bash
pnpm dev
```

The default local app URL is `http://localhost:3000`.

## Environment Variables

Required:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `NEW_API_BASE_URL`: Base URL for the New API gateway, without a trailing slash.
- `NEW_API_KEY`: API key used for model requests through New API.
- `APP_BASE_URL`: Public base URL for the web app.

Optional:

- `ENABLE_CRYPTO_PAYMENTS`: Keep unset or `false` by default. Set to `true` only after legal review and separate operational controls are in place.
- `ACADEMIC_HUB_E2E_MODE`: Used only by Playwright tests to run the conversion flow without a local database.

## Database Setup

Start PostgreSQL locally and make sure `DATABASE_URL` points to it. Then run:

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

The seed script syncs the A0/A1/A2/A3/B1/B2/B3 plan catalog into the `Plan` table.

If port `5432` is already used, change the host port in `docker-compose.yml` and update `DATABASE_URL` in `.env`.

## Test Commands

Run type checks:

```bash
pnpm typecheck
```

Run unit and integration tests:

```bash
pnpm test
```

Run the Playwright conversion flow:

```bash
pnpm test:e2e
```

The E2E command starts Next.js on `127.0.0.1:3100` with `ACADEMIC_HUB_E2E_MODE=true`. It does not require PostgreSQL or a real New API key.

Run a production build:

```bash
pnpm build
```

When running `pnpm build` without a local database, provide a valid-looking `DATABASE_URL` so Prisma can initialize during Next.js build-time checks:

```bash
DATABASE_URL=postgresql://academic_hub:academic_hub@localhost:5432/academic_hub pnpm build
```

## Deployment Notes

- Provision PostgreSQL before deploy and run Prisma migrations during release.
- Configure the New API endpoint, key, model channels, and usage reporting before enabling workflows for users.
- Create at least one admin user directly in the database before exposing `/admin`.
- Launch with domestic payment methods first. Crypto payment must remain disabled unless legal, accounting, and operational controls are approved.
- Monitor quota consumption, workflow errors, payment order status, and heavy usage owners from day one.

Minimum production environment:

```bash
DATABASE_URL=postgresql://...
NEW_API_BASE_URL=https://your-new-api.example.com
NEW_API_KEY=...
APP_BASE_URL=https://your-domain.example.com
ENABLE_CRYPTO_PAYMENTS=false
```

Minimum release sequence:

```bash
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm build
pnpm start
```

# Setup Guide

Follow these steps to run the Whop Embed Link Creator locally.

## 1. Clone & Install

```bash
git clone https://github.com/edisonlovescodes/checkout.git
cd checkout
npm install
```

## 2. Create a Postgres database

You can use Neon, Supabase, Railway, or any managed Postgres. Copy the connection URL and place it
into `.env.local`.

## 3. Environment variables

Duplicate the sample file:

```bash
cp .env.local.example .env.local
```

Fill in the following keys:

| Variable        | Description                                            |
| --------------- | ------------------------------------------------------ |
| `DATABASE_URL`  | Postgres connection string                             |
| `WHOP_API_KEY`  | API key from the Whop developer dashboard               |
| `WHOP_APP_ID`   | Whop app ID (optional but recommended)                 |
| `LOG_LEVEL`     | Optional logging level (`debug`, `info`, `warn`, `error`)|

Local-only helpers such as `WHOP_BASE_PLAN_ID` or bump IDs are optional and mainly exist to help you
seed the dashboard.

## 4. Run Prisma migrations

```bash
npm run db:migrate -- --name init
```

This generates the Prisma client and applies the schema defined in `prisma/schema.prisma`. If you
change models later, run the same command with a new migration name.

## 5. Start the dev server

```bash
npm run dev
```

- Dashboard: `http://localhost:3000/dashboard/<companyId>` (load via the Whop dev proxy so the
  request carries the `x-whop-user-token` header).
- Checkout: `http://localhost:3000/checkout/<companyId>` (public preview page).

## 6. Configure Whop

1. Open the Whop developer dashboard and create an app.
2. Enable the developer proxy and point it to `http://localhost:3000`.
3. Install the app inside a test company.
4. Visit the dashboard view from the Whop sidebar—the page should load with your Whop identity.

## 7. Seed data (optional)

If you want to pre-populate a config for testing, insert a row into the `CompanyConfig` table with
your `companyId` and base plan ID. Otherwise, the dashboard allows you to configure everything on the
fly once permissions are verified.

You are now ready to iterate on the checkout experience, add order bumps, and test webhook
forwarding.

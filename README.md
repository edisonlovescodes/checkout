# Whop Embed Link Creator

A Whop-native app that lets creators configure hosted checkout pages with multi-bump offers, custom
copy/theme, prefill, redirects, and webhook forwarding – all without leaving Whop.

## Features

- **Dashboard view** (`/dashboard/[companyId]`): Runs inside the Whop developer iframe. Creators can
  update checkout copy, theme, trust badges, base plan, up to three order bumps, prefill settings,
  redirect URL, and automation webhook. No extra authentication.
- **Hosted checkout page** (`/checkout/[companyId]`): Public page buyers visit. Renders the wrapper,
  applies single-select bumps, mounts the Whop plan-based embed, handles URL prefill, and manages
  post-purchase webhook forwarding + redirect.
- **API surface**: REST endpoints for reading public configuration, saving creator changes (with
  validation + rate limits), and forwarding payment webhooks with idempotency tracking.
- **Security-first defaults**: CSP headers, sanitized text fields, HTTPS-only redirects/webhooks,
  Whop token verification in middleware, and no iframe tampering.
- **Vercel-ready**: Prisma/Postgres persistence, edge middleware, and deployment scripts for
  migrations.

## Tech Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Prisma ORM with PostgreSQL backend
- Whop SDK for token verification and access checks
- Vercel for hosting & environment management

## Directory Overview

```
app/
  dashboard/[companyId]/page.tsx      # Creator dashboard UI (inside Whop)
  checkout/[companyId]/page.tsx       # Buyer-facing hosted checkout
  api/company/[companyId]/route.ts    # Public config lookup
  api/company/[companyId]/save/route.ts # Authenticated config save
  api/automation/webhook/route.ts     # Webhook forwarding endpoint
components/
  DashboardForm.tsx                   # Main dashboard form
  BumpEditor.tsx                      # Order bump editor row
  CheckoutWrapper.tsx                 # Hosted checkout layout
  WhopEmbed.tsx                       # Mounts Whop iframe safely
lib/
  auth.ts, db.ts, env.ts, sanitize.ts, validation.ts, rate-limit.ts
middleware.ts                         # Verifies Whop token for dashboard/API routes
prisma/schema.prisma                  # Database models
```

## Getting Started

1. **Clone & install**

   ```bash
   git clone https://github.com/edisonlovescodes/checkout.git
   cd checkout
   npm install
   ```

2. **Provision Postgres** (Neon, Supabase, Railway, etc.) and grab the connection string.

3. **Configure environment** – copy the example file and fill the values:

   ```bash
   cp .env.local.example .env.local
   ```

   Required variables:

   - `DATABASE_URL` – Postgres URL used by Prisma.
   - `WHOP_API_KEY` – API key from the Whop developer dashboard.
   - `WHOP_APP_ID` – Your Whop app ID (used when verifying tokens).
   - Optional: `LOG_LEVEL`, `WHOP_BASE_PLAN_ID`, etc. for local sanity.

4. **Run Prisma migrations locally** (requires Postgres reachable from your machine):

   ```bash
   npm run db:migrate -- --name init
   ```

5. **Start the dev server**:

   ```bash
   npm run dev
   ```

   - Dashboard view: `http://localhost:3000/dashboard/<companyId>` (load through the Whop dev proxy
     so the `x-whop-user-token` header is injected).
   - Hosted checkout: `http://localhost:3000/checkout/<companyId>` (public preview).

## Whop Integration Notes

1. **Create a Whop app** in the developer console and enable the dev proxy pointing to your local
   server.
2. **Permissions**: request `plan:basic:read`, `plan:manage`, `company:basic:read`, and
   `webhook_receive:*` if you plan to forward webhooks on behalf of creators.
3. **Install** the app into a test company. The dashboard route will verify the Whop token + admin
   access automatically.
4. **Webhook forwarding**: creators can enter a webhook URL. The app forwards `payment.succeeded`
   events and ensures idempotency via the `WebhookForwardLog` table.

## Deployment (Vercel)

1. **Create project** on Vercel and connect this repository.
2. **Set environment variables** in Vercel (Production, Preview, Development):

   - `DATABASE_URL`
   - `WHOP_API_KEY`
   - `WHOP_APP_ID`
   - Optional: `LOG_LEVEL`

3. **Set up database migrations** by enabling the “Automatically run `prisma migrate deploy`” build
   command (already prepended to `npm run build`).
4. **Deploy**. Vercel will link the GitHub repo, run Prisma generate, and deploy the Next.js app.
5. **Production URL** → Configure it inside your Whop app so the hosted checkout link points to your
   Vercel domain.

## API Reference

- `GET /api/company/[companyId]`
  - Public endpoint returning sanitized checkout config (no webhook URL).
- `POST /api/company/[companyId]/save`
  - Requires Whop admin token (handled by middleware). Validates fields, caps bumps at 3, enforces
    HTTPS URLs, and rate-limits by IP/company.
  - On validation error returns:
    ```json
    {
      "error": {
        "code": "VALIDATION_FAILED",
        "fields": {
          "basePlanId": "Plan ID must start with plan_..."
        }
      }
    }
    ```
- `POST /api/automation/webhook`
  - Server-to-server endpoint for forwarding payment events to the creator’s automation webhook with
    retries and idempotency.

## Acceptance Checklist

- ✅ Whop token verification + access checks in middleware.
- ✅ Dashboard form validates plan IDs, URLs, bump limits, and sort order.
- ✅ Hosted checkout remounts the Whop embed whenever the selected plan changes.
- ✅ Prefill attributes omitted when disabled; loader hidden once iframe appears.
- ✅ Webhook forwarding uses idempotent log table with exponential retry.
- ✅ CSP headers & sanitization prevent arbitrary HTML injection.
- ✅ Accessible controls (radio buttons, aria-live loader, reduced-motion support).

## Troubleshooting

- **403 on dashboard** – ensure the request flows through the Whop dev proxy so the
  `x-whop-user-token` header is present and the user has admin/creator permissions.
- **Plan IDs rejected** – use Whop plan-based embed IDs (start with `plan_`). Bundle plans must
  include the order bump price baked in.
- **Prefill not working** – confirm `allowPrefill` is toggled on and the URL contains valid
  parameters (`email`, `name`, `address` fields). Prefill attributes are only added when enabled.
- **Webhook forwarding** – check the `WebhookForwardLog` table for status/attempt counts if the
  automation isn’t receiving events.

Built specifically for the Whop ecosystem – extend it with analytics, A/B testing, or additional
buyer experiences as your app grows.

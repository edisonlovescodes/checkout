# Whop App Notes

Key references and behaviours when building a Whop-native checkout link creator.

## Dashboard vs. Hosted Checkout

- **Dashboard view** (`/dashboard/[companyId]`)
  - Runs inside the creator dashboard sidebar. Whop injects `x-whop-user-token` on every request.
  - Verify the token and call `users.checkAccess(companyId)` – allow only `admin` and `creator`.
  - No extra login flows. All configuration persists by `companyId` in the database.
- **Hosted checkout** (`/checkout/[companyId]`)
  - Public, unauthenticated page on your own domain.
  - Reads configuration from the database, renders the wrapper + order bumps, and mounts the Whop
    plan-based iframe with the selected plan ID.

## Token verification & permissions

- Use the official Whop SDK in both middleware (edge) and API handlers.
- Required scopes typically include `plan:basic:read`, `plan:manage`, `company:basic:read`, and
  `webhook_receive:*` if you forward webhooks on the creator’s behalf.
- Creators approve these scopes during install—request only what you use.

## Plan-based embeds & bumps

- Each order bump must map to its own plan ID (`plan_...`) that already includes the bundle price.
- Switching plan IDs is the only supported way to change pricing—never attempt to inject scripts or
  CSS into the iframe.
- Prefill attributes are limited to email, name, and address components via
  `data-whop-checkout-prefill-*`. Only set them when the creator enables prefill.

## Post-purchase behaviour

- Whop appends `payment_id` to the return URL. Use it to:
  - Forward `payment.succeeded` events to the creator’s webhook (with idempotency + retries).
  - Redirect buyers to a custom thank-you page while preserving `payment_id` in query params.
- Store forwarding attempts in your database to avoid duplicate automations.

## Rate limits

- `/v5/*` endpoints: **20 requests / 10 seconds**, then a 60-second cooldown.
- `/v2/*` endpoints: **100 requests / 10 seconds** (legacy – avoid when possible).
- Cache plan metadata locally and batch reads to stay below limits.

## Distribution checklist

- Working dashboard + checkout flow with a real Whop install.
- Responsive wrapper, accessible controls (radio buttons, aria-live loader), and polished light/dark
theme support.
- Copy requests only the permissions you need.
- Provide hosted checkout link + embed snippet inside the dashboard for convenience.

## Helpful documentation

- Getting started: https://docs.whop.com/apps/getting-started
- App views: https://docs.whop.com/apps/guides/app-views
- Checkout embeds: https://docs.whop.com/payments/checkout-embed
- Permissions: https://docs.whop.com/apps/guides/permissions
- Webhooks: https://docs.whop.com/apps/guides/webhooks
- Rate limits: https://docs.whop.com/api-reference/v2/rate-limits

# Checkout OS

Checkout OS is a free Whop-native checkout that delivers a hosted page with order bumps, prefill, and
post-purchase automation in four fields or less. No databases, no environment variables, and no
extra tooling — just install the app, fill out the mini form, and share
`yourapp.com/checkout/<companyId>`.

## What ships

- **Dashboard** – `/dashboard/[companyId]` renders inside the Whop iframe. Creators enter:
  base plan ID, bump plan ID, bump title, and optional thank-you URL.
- **Hosted checkout** – `/checkout/[companyId]` surfaces a clean, mobile-friendly card with a
  green upsell toggle, spinner, and Whop embed. URL parameters like `?email=` auto-fill the form.
- **Automation** – when `payment_id` appears in the query string, Checkout OS posts the payload to
  the thank-you URL and then redirects, keeping automation flows alive without server setup.
- **API** – `POST /api/save` persists config in memory for the current runtime; `GET /api/save?id=`
  returns it for the checkout page.

## Getting started

```bash
npm install
npm run dev
```

That’s it — no `.env`, no migrations. Visit `/dashboard/demo` locally, enter the four fields, and
preview `/checkout/demo`.

## Deploying

Deploy to Vercel with the default Next.js settings (`vercel --prod` or the dashboard import). There
are no secrets to configure. Because configs are stored in memory, production users should swap the
store in `lib/config-store.ts` for a persistent service (Vercel KV, Upstash Redis, Supabase, etc.) if
they need long-lived data.

## Structure

```
app/
  page.tsx                    # Landing page w/ install CTA
  dashboard/[companyId]/page.tsx  # Four-field dashboard form
  checkout/[companyId]/page.tsx   # Buyer-facing hosted checkout
  api/save/route.ts           # Simple in-memory config API
components/
  CheckoutWrapper.tsx         # Checkout UI + bump toggle + automation
  WhopEmbed.tsx               # Whop embed loader with spinner
lib/
  config-store.ts             # In-memory Map used for demo storage
```

## Notes

- Prefill works for `email` and `name` query parameters.
- Buttons inherit a green palette globally to match the promise.
- Replace `YOUR_APP_ID` in `app/page.tsx` with the live Whop app ID before shipping.

Feel free to extend the store, harden CSP, or add analytics — the foundations stay no-setup and
creator friendly.

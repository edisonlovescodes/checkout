# Setup

Checkout OS is intentionally zero-config.

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the dev server

   ```bash
   npm run dev
   ```

3. Visit the dashboard at `http://localhost:3000/dashboard/demo`, fill the four fields, then open
   `http://localhost:3000/checkout/demo` to preview the hosted checkout.

No database, no environment variables, and nothing extra to provision. Replace the in-memory store in
`lib/config-store.ts` with your preferred persistent storage when you’re ready to keep configs across
deploys.

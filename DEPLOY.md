# Deploying Checkout OS

There’s nothing to wire up — deploy like any standard Next.js app.

1. Push the project to a Git repo (or keep using this one).
2. On Vercel, choose “Import Project” → connect the repo → keep the default build settings.
3. Deploy (`vercel --prod` or through the dashboard).

No environment variables or databases are required for the demo. The in-memory config store resets on
each cold start; swap the implementation in `lib/config-store.ts` for a persistent service (Vercel KV,
Upstash Redis, etc.) when you want production durability.

After deployment, update your Whop app’s base URL to the Vercel domain and you’re live:

- Dashboard: `https://your-vercel-app.vercel.app/dashboard/<companyId>`
- Checkout: `https://your-vercel-app.vercel.app/checkout/<companyId>`

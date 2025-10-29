# Deployment Guide (Vercel)

This app is built for Vercel + PostgreSQL. Follow the steps below to launch in production.

## 1. Prepare your database

- Create a production Postgres database (Neon, Supabase, Railway, etc.).
- Copy the connection URL and keep it handy.

## 2. Create a Vercel project

- Import the GitHub repository into Vercel.
- When prompted, keep the default build command (`npm run build`). This already runs
  `prisma generate` so migrations can deploy automatically.

## 3. Configure environment variables

In **Vercel → Project → Settings → Environment Variables**, add the following keys for **Production**,
**Preview**, and **Development** environments:

| Key                    | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `DATABASE_URL`         | Postgres connection string                     |
| `WHOP_API_KEY`         | Whop API key                                   |
| `WHOP_APP_ID`          | Whop app ID                                    |
| `LOG_LEVEL` (optional) | `debug`, `info`, `warn`, or `error`             |

You can add additional defaults (e.g. starter plan IDs) if desired, but they are not required.

## 4. Run migrations on deploy

Add a Vercel build hook or use GitHub actions to run:

```bash
npm run db:deploy
```

For simple setups, you can create a Deploy Hook in Vercel that triggers `npm run db:deploy` before
`npm run build`. Alternatively, run the command manually after the first deploy using Vercel CLI:

```bash
vercel env pull
DATABASE_URL=... npm run db:deploy
```

## 5. Deploy

Push to `main` (or any connected branch). Vercel will build and deploy automatically. The build
output will include the hosted checkout URL, e.g.:

```
https://your-project.vercel.app
```

Use this domain inside the Whop app settings (`Base URL` / hosted checkout link).

## 6. Post-deploy checklist

- Visit `https://your-project.vercel.app/dashboard/<companyId>` through the Whop app to confirm the
  dashboard loads with valid credentials.
- Test `/checkout/<companyId>` without authentication to ensure the embed loads and bumps work.
- Submit a test purchase in Whop’s sandbox, confirm webhook forwarding (if configured), and verify
  redirect behaviour.

## 7. Custom domains (optional)

Add any custom domains under **Vercel → Settings → Domains** and update DNS records per the wizard.
Remember to update the Whop app configuration to use the same domain.

## 8. Environment rotation

If you rotate credentials (e.g. `WHOP_API_KEY`), update Vercel environment variables and redeploy.
No further action is required; the middleware reads the values at runtime.

You’re done! Creators can now install the app, configure their hosted checkout, and share the link
or embed snippet anywhere.

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center text-emerald-900">
      <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">Checkout OS</h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-emerald-700">
        Free hosted checkouts for Whop. No code. No GoHighLevel. Fill 4 fields once and instantly share
        <span className="font-semibold"> yourapp.com/checkout/&lt;companyId&gt;</span> with a single-click upsell.
      </p>
      <a
        href="https://whop.com/apps/install?app_id=YOUR_APP_ID"
        className="mt-10 inline-flex items-center rounded-full bg-emerald-500 px-10 py-3 text-lg font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600"
      >
        Install Free
      </a>
    </main>
  )
}

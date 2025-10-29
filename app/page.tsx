import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center text-slate-800">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
        Whop Embed Link Creator
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
        Install the app in Whop, configure checkout copy and order bumps from the dashboard view, and
        share your hosted checkout link anywhere. Buyers always pay through Whop&apos;s secure iframe.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm font-semibold">
        <Link
          href="https://docs.whop.com/apps/getting-started"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-slate-300 px-6 py-3 text-slate-700 hover:border-slate-400"
        >
          Developer quick start ↗
        </Link>
        <Link
          href="/checkout/demo"
          className="rounded-full bg-slate-900 px-6 py-3 text-white shadow-lg shadow-slate-900/15"
        >
          Sample checkout
        </Link>
      </div>
    </main>
  )
}

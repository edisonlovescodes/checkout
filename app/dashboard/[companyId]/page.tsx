import { headers } from 'next/headers'
import { getCheckoutLink, getConfig } from '@/lib/config-store'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: { companyId: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const config = getConfig(params.companyId)
  const host = headers().get('x-forwarded-host') ?? 'yourapp.com'
  const protocol = headers().get('x-forwarded-proto') ?? 'https'
  const baseUrl = `${protocol}://${host}`
  const checkoutLink = getCheckoutLink(baseUrl, params.companyId)
  const savedParam = searchParams.saved
  const saved = Array.isArray(savedParam) ? savedParam.includes('1') : savedParam === '1'

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="rounded-3xl bg-white p-10 shadow-2xl shadow-emerald-500/10 ring-1 ring-emerald-100">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">Dashboard</p>
          <h1 className="mt-2 text-4xl font-semibold text-emerald-900">Fill 4 fields. Get your link.</h1>
          <p className="mt-3 text-sm text-emerald-600">
            No code, no setup. Just map your Whop plans and hit save.
          </p>
        </header>

        <form action="/api/save" method="POST" className="mt-10 space-y-4">
          <input type="hidden" name="companyId" value={params.companyId} />
          <input
            name="basePlanId"
            placeholder="Base Plan ID (required)"
            defaultValue={config?.basePlanId ?? ''}
            required
            className="w-full rounded-xl border border-emerald-200 px-4 py-3 text-sm text-emerald-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <input
            name="bundlePlanId"
            placeholder="Bump Plan ID (optional)"
            defaultValue={config?.bundlePlanId ?? ''}
            className="w-full rounded-xl border border-emerald-200 px-4 py-3 text-sm text-emerald-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <input
            name="bumpTitle"
            placeholder="Bump Title (e.g. Add Hooks $17)"
            defaultValue={config?.bumpTitle ?? ''}
            className="w-full rounded-xl border border-emerald-200 px-4 py-3 text-sm text-emerald-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <input
            name="redirectUrl"
            placeholder="Thank You URL (optional)"
            defaultValue={config?.redirectUrl ?? ''}
            className="w-full rounded-xl border border-emerald-200 px-4 py-3 text-sm text-emerald-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600"
          >
            Save &amp; Get Link
          </button>
        </form>

        <div className="mt-8 rounded-2xl bg-emerald-50/80 p-6 text-sm text-emerald-700">
          {saved ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">
              Saved
            </p>
          ) : null}
          <p className="font-semibold">Checkout link</p>
          <p className="mt-1 break-all text-xs">{checkoutLink}</p>
        </div>
      </div>
    </main>
  )
}

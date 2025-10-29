import prisma from '@/lib/db'
import { DashboardForm } from '@/components/DashboardForm'
import type { PublicBump } from '@/types/config'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({ params }: { params: { companyId: string } }) {
  const looksLikeBiz = (id?: string) => !!id && /^biz_[A-Za-z0-9]/.test(id)
  const badParam = !looksLikeBiz(params.companyId)
  const banner = badParam ? (
    <div className="mx-auto mb-6 max-w-6xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      The company id in the URL isn’t valid. If you opened this from Whop, we’ll try to recover.
      Make sure your app path in Whop is set to <code className="mx-1 rounded bg-amber-100 px-1">/dashboard/[companyId]</code>.
    </div>
  ) : null


  const config = await prisma.companyConfig.findUnique({
    where: { companyId: params.companyId },
    include: {
      bumps: {
        orderBy: { sortIndex: 'asc' },
      },
    },
  })

  const bumps: PublicBump[] = (config?.bumps ?? []).map((bump) => ({
    id: bump.id,
    title: bump.title,
    description: bump.description,
    priceLabel: bump.priceLabel,
    planId: bump.planId,
    badge: bump.badge,
    highlightColor: bump.highlightColor,
    position: bump.position as PublicBump['position'],
    defaultSelected: bump.defaultSelected,
    sortIndex: bump.sortIndex,
  }))

  const initialConfig = {
    companyId: params.companyId,
    headline: config?.headline ?? '',
    subheadline: config?.subheadline ?? '',
    ctaText: config?.ctaText ?? 'Checkout',
    basePlanId: config?.basePlanId ?? '',
    allowPrefill: config?.allowPrefill ?? true,
    theme: (config?.theme ?? 'light') as 'light' | 'dark' | 'system',
    accent: (config?.accent ?? 'sky') as 'sky' | 'blue' | 'green' | 'purple' | 'amber',
    showBadges: config?.showBadges ?? false,
    redirectUrl: config?.redirectUrl ?? '',
    webhookUrl: config?.webhookUrl ?? '',
    bumps,
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
      {banner}
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Dashboard</p>
        <h1 className="text-3xl font-semibold text-slate-900">Embed Link Creator</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Configure the hosted checkout page and generated link your buyers will use. We verify your
          Whop permissions automatically—no extra logins required.
        </p>
      </header>
      <DashboardForm companyId={params.companyId} initialConfig={initialConfig} />
    </main>
  )
}

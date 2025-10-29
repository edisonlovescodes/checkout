import { notFound } from 'next/navigation'
import prisma from '@/lib/db'
import { CheckoutWrapper } from '@/components/CheckoutWrapper'
import type { WhopPrefillMap } from '@/components/WhopEmbed'
import type { PublicCompanyConfig, PublicBump } from '@/types/config'

export const dynamic = 'force-dynamic'

const PREFILL_FIELDS = ['email', 'name', 'country', 'line1', 'line2', 'city', 'state', 'postal'] as const

type PrefillKey = (typeof PREFILL_FIELDS)[number]

function extractPrefill(searchParams: Record<string, string | string[] | undefined>): WhopPrefillMap {
  const map: WhopPrefillMap = {}
  for (const key of PREFILL_FIELDS) {
    const value = searchParams[key]
    if (!value) continue
    const stringValue = Array.isArray(value) ? value[0] : value
    if (stringValue) {
      map[key] = stringValue.trim()
    }
  }
  return map
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: { companyId: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const config = await prisma.companyConfig.findUnique({
    where: { companyId: params.companyId },
    include: {
      bumps: {
        orderBy: { sortIndex: 'asc' },
      },
    },
  })

  if (!config) {
    notFound()
  }

  const bumps: PublicBump[] = config.bumps.map((bump) => ({
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

  const publicConfig: PublicCompanyConfig = {
    companyId: config.companyId,
    headline: config.headline,
    subheadline: config.subheadline,
    ctaText: config.ctaText,
    basePlanId: config.basePlanId,
    allowPrefill: config.allowPrefill,
    theme: config.theme as PublicCompanyConfig['theme'],
    accent: config.accent as PublicCompanyConfig['accent'],
    showBadges: config.showBadges,
    redirectUrl: config.redirectUrl,
    bumps,
  }

  const prefill = config.allowPrefill ? extractPrefill(searchParams) : {}
  const paymentIdParam = searchParams.payment_id
  const paymentId = Array.isArray(paymentIdParam) ? paymentIdParam[0] : paymentIdParam
  const bumpIdParam = searchParams.bumpId
  const bumpId = Array.isArray(bumpIdParam) ? bumpIdParam[0] : bumpIdParam

  return (
    <main className="min-h-screen">
      <CheckoutWrapper
        companyId={params.companyId}
        config={publicConfig}
        prefill={prefill}
        paymentId={paymentId}
        webhookUrl={config.webhookUrl}
        initialSelectedBumpId={bumpId}
      />
    </main>
  )
}

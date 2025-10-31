import { notFound } from 'next/navigation'
import { CheckoutWrapper } from '@/components/CheckoutWrapper'
import { getConfig } from '@/lib/config-store'

export const dynamic = 'force-dynamic'

const PREFILL_FIELDS = ['email', 'name'] as const

type PrefillKey = (typeof PREFILL_FIELDS)[number]

function extractPrefill(searchParams: Record<string, string | string[] | undefined>) {
  const values: Partial<Record<PrefillKey, string>> = {}
  for (const key of PREFILL_FIELDS) {
    const value = searchParams[key]
    if (!value) continue
    const stringValue = Array.isArray(value) ? value[0] : value
    if (stringValue?.trim()) {
      values[key] = stringValue.trim()
    }
  }
  return values
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: { companyId: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const config = getConfig(params.companyId)
  if (!config) {
    notFound()
  }

  const prefill = extractPrefill(searchParams)
  const paymentIdParam = searchParams.payment_id
  const paymentId = Array.isArray(paymentIdParam) ? paymentIdParam[0] : paymentIdParam

  return (
    <main className="min-h-screen bg-emerald-50/40 py-16">
      <CheckoutWrapper
        companyId={params.companyId}
        config={config}
        prefill={prefill}
        paymentId={paymentId}
      />
    </main>
  )
}

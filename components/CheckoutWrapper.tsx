"use client"

import { useEffect, useMemo, useState } from 'react'
import type { CheckoutConfig } from '@/lib/config-store'
import { WhopEmbed } from './WhopEmbed'

type PrefillMap = Partial<Record<'email' | 'name', string>>

interface CheckoutWrapperProps {
  companyId: string
  config: CheckoutConfig
  prefill: PrefillMap
  paymentId?: string | null
}

export function CheckoutWrapper({ companyId, config, prefill, paymentId }: CheckoutWrapperProps) {
  const [selectedPlan, setSelectedPlan] = useState(() => config.bundlePlanId || config.basePlanId)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    setSelectedPlan((previous) => {
      if (previous === config.bundlePlanId || previous === config.basePlanId) {
        return previous
      }
      return config.bundlePlanId || config.basePlanId
    })
  }, [config.basePlanId, config.bundlePlanId])

  useEffect(() => {
    if (!paymentId) return

    const automationPayload = JSON.stringify({
      payment_id: paymentId,
      companyId,
      planId: selectedPlan,
      timestamp: Date.now(),
    })

    if (config.redirectUrl) {
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(config.redirectUrl, automationPayload)
        } else {
          void fetch(config.redirectUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: automationPayload,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      } catch {
        // best-effort automation
      }

      const target = new URL(config.redirectUrl, window.location.href)
      target.searchParams.set('payment_id', paymentId)
      window.location.replace(target.toString())
      return
    }

    setStatusMessage('Payment received! Check your email for instant access.')
  }, [companyId, config.redirectUrl, paymentId, selectedPlan])

  const bumpEnabled = Boolean(config.bundlePlanId)
  const activePlanId = useMemo(() => {
    if (!bumpEnabled) return config.basePlanId
    return selectedPlan || config.bundlePlanId || config.basePlanId
  }, [bumpEnabled, config.basePlanId, config.bundlePlanId, selectedPlan])

  return (
    <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 shadow-2xl shadow-emerald-500/10 ring-1 ring-emerald-100">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-emerald-900">{config.bumpTitle || 'Get Instant Access'}</h1>
        <p className="mt-2 text-sm text-emerald-600">
          One hosted checkout. One click upsell. Built for Whop creators.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        <label className="flex cursor-pointer items-center rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 transition hover:border-emerald-300">
          <input
            type="radio"
            name="checkout-plan"
            checked={activePlanId === config.basePlanId}
            onChange={() => setSelectedPlan(config.basePlanId)}
            className="h-5 w-5 accent-emerald-500"
          />
          <div className="ml-3">
            <p className="font-semibold text-emerald-900">Base offer</p>
            <p className="text-xs text-emerald-600/80">Core plan only — no add-ons.</p>
          </div>
        </label>

        {bumpEnabled ? (
          <label className="flex cursor-pointer items-center rounded-2xl border border-emerald-500 bg-emerald-50 p-4 transition hover:border-emerald-600">
            <input
              type="radio"
              name="checkout-plan"
              checked={activePlanId === config.bundlePlanId}
              onChange={() => setSelectedPlan(config.bundlePlanId!)}
              className="h-5 w-5 accent-emerald-600"
            />
            <div className="ml-3">
              <p className="font-semibold text-emerald-700">
                {config.bumpTitle || 'Yes! Add the one-click upsell'}
              </p>
              <p className="text-xs text-emerald-600">
                Boost your order value instantly — toggle off anytime.
              </p>
            </div>
          </label>
        ) : null}
      </div>

      <div className="mt-8">
        <WhopEmbed planId={activePlanId} prefill={prefill} />
      </div>

      {statusMessage ? (
        <p className="mt-4 text-center text-sm font-semibold text-emerald-600">{statusMessage}</p>
      ) : null}

      <style jsx>{`
        button,
        .whop-checkout-embed button {
          background: #10b981 !important;
          border-radius: 9999px !important;
        }
      `}</style>
    </div>
  )
}

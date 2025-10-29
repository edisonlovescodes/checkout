"use client"

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import type { PublicBump, PublicCompanyConfig } from '@/types/config'
import { WhopEmbed, type WhopPrefillMap } from './WhopEmbed'

interface CheckoutWrapperProps {
  companyId: string
  config: PublicCompanyConfig
  prefill: WhopPrefillMap
  paymentId?: string
  webhookUrl?: string | null
}

const highlightStyles: Record<string, string> = {
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  sky: 'border-sky-200 bg-sky-50 text-sky-700',
  violet: 'border-violet-200 bg-violet-50 text-violet-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
}

const accentStyles: Record<string, string> = {
  sky: 'bg-sky-100 text-sky-600',
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-emerald-100 text-emerald-600',
  purple: 'bg-violet-100 text-violet-600',
  amber: 'bg-amber-100 text-amber-700',
}

function getActivePlanId(basePlanId: string, bumps: PublicBump[], selectedBumpId?: string) {
  if (!selectedBumpId) return basePlanId
  const bump = bumps.find((candidate) => candidate.id === selectedBumpId)
  return bump?.planId ?? basePlanId
}

export function CheckoutWrapper({
  companyId,
  config,
  prefill,
  paymentId,
  webhookUrl,
}: CheckoutWrapperProps) {
  const [selectedBumpId, setSelectedBumpId] = useState<string | undefined>(() => {
    const defaultBump = config.bumps.find((bump) => bump.defaultSelected)
    return defaultBump?.id
  })
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [forwardingState, setForwardingState] = useState<'idle' | 'sending' | 'done'>('idle')

  const activePlanId = useMemo(
    () => getActivePlanId(config.basePlanId, config.bumps, selectedBumpId),
    [config.basePlanId, config.bumps, selectedBumpId]
  )

  useEffect(() => {
    if (!paymentId) return
    let cancelled = false
    const id = paymentId

    async function handlePostPurchase() {
      if (webhookUrl && forwardingState === 'idle') {
        setForwardingState('sending')
        try {
          const res = await fetch('/api/automation/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payment_id: id,
              companyId,
              event: 'payment.succeeded',
            }),
          })
          if (!res.ok) {
            throw new Error('Forward failed')
          }
        } catch (error) {
          console.error('[whop-checkout] webhook forwarding failed', error)
        } finally {
          if (!cancelled) {
            setForwardingState('done')
          }
        }
      }

      if (config.redirectUrl) {
        const redirect = new URL(config.redirectUrl)
        redirect.searchParams.set('payment_id', id)
        window.location.replace(redirect.toString())
        return
      }

      if (!cancelled) {
        setStatusMessage('Payment received! Check your email for access details.')
      }
    }

    handlePostPurchase()

    return () => {
      cancelled = true
    }
  }, [companyId, config.redirectUrl, forwardingState, paymentId, webhookUrl])

  const themeClasses =
    config.theme === 'dark'
      ? 'bg-slate-900 text-white'
      : config.theme === 'system'
      ? 'bg-gradient-to-b from-white to-slate-50 text-slate-900'
      : 'bg-white text-slate-900'

  const accentClass = accentStyles[config.accent] ?? 'bg-slate-200 text-slate-700'

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:gap-12 md:py-16">
      <aside className={clsx('flex-1 rounded-3xl border border-slate-200 shadow-lg shadow-slate-900/10', themeClasses)}>
        <div className="space-y-6 px-8 py-10">
          <header className="space-y-2">
            <span className={clsx(
              'inline-flex rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em]',
              accentClass
            )}>
              Hosted checkout
            </span>
            <h1 className="text-3xl font-semibold tracking-tight">{config.headline || 'Complete your purchase'}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              {config.subheadline ||
                'Review the order bump options below to get the most value from your purchase.'}
            </p>
          </header>

          <div className="space-y-4">
            <fieldset className="space-y-3" aria-label="Order bump">
              <legend className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Upgrade your order
              </legend>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-700 shadow-sm shadow-slate-900/10 transition hover:border-slate-300">
                <input
                  type="radio"
                  name="order-bump"
                  checked={!selectedBumpId}
                  onChange={() => setSelectedBumpId(undefined)}
                  className="h-4 w-4 accent-slate-900"
                />
                <div>
                  <p className="font-semibold text-slate-900">Just the base plan</p>
                  <p className="text-xs text-slate-500">Purchase the core offer without any add-ons.</p>
                </div>
              </label>
              {config.bumps.map((bump) => {
                const highlight = bump.highlightColor ? highlightStyles[bump.highlightColor] : 'border-slate-200 bg-white'
                return (
                  <label
                    key={bump.id}
                    className={clsx(
                      'flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 text-sm shadow-sm shadow-slate-900/10 transition hover:border-slate-300',
                      highlight
                    )}
                  >
                    <input
                      type="radio"
                      name="order-bump"
                      checked={selectedBumpId === bump.id}
                      onChange={() => setSelectedBumpId(bump.id)}
                      className="mt-1 h-4 w-4 accent-slate-900"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold">{bump.title}</p>
                        {bump.badge ? (
                          <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-700">
                            {bump.badge}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm opacity-80">{bump.description}</p>
                      <p className="text-sm font-semibold text-slate-900">{bump.priceLabel}</p>
                    </div>
                  </label>
                )
              })}
            </fieldset>
          </div>

          <footer className="space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Continue below to complete checkout securely with Whop.
            </p>
            {config.showBadges ? (
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <Badge>Secure payments</Badge>
                <Badge>Instant access</Badge>
                <Badge>30-day guarantee</Badge>
              </div>
            ) : null}
            {statusMessage ? (
              <p className="text-xs font-semibold text-emerald-600">{statusMessage}</p>
            ) : null}
          </footer>
        </div>
      </aside>

      <section className="flex-1 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl shadow-slate-900/10">
        <WhopEmbed
          planId={activePlanId}
          theme={config.theme}
          accent={config.accent}
          allowPrefill={config.allowPrefill}
          prefill={prefill}
        />
      </section>
    </div>
  )
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white/70 px-3 py-1 font-medium text-slate-600 shadow-sm shadow-slate-900/5">
      {children}
    </span>
  )
}

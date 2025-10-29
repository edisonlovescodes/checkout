"use client"

import { useEffect, useMemo, useState, useTransition } from 'react'
import clsx from 'clsx'
import { BumpEditor, BumpFormState } from './BumpEditor'
import { ACCENTS, THEMES, parseCompanyConfigPayload, CompanyConfigInput } from '@/lib/validation'
import type { PublicCompanyConfig, PublicBump } from '@/types/config'
import { sanitizeText } from '@/lib/sanitize'

type DashboardConfig = Omit<
  PublicCompanyConfig,
  'bumps'
> & {
  webhookUrl?: string | null
  bumps: Array<
    PublicBump & {
      badge?: string | null
      highlightColor?: string | null
    }
  >
}

interface Props {
  companyId: string
  initialConfig: DashboardConfig
}

type FieldErrors = Record<string, string>

const HREF_ORIGIN = typeof window === 'undefined' ? '' : window.location.origin

function normalizeBumps(bumps: DashboardConfig['bumps']): BumpFormState[] {
  return bumps
    .slice()
    .sort((a, b) => a.sortIndex - b.sortIndex)
    .map((bump, index) => ({
      id: bump.id,
      title: bump.title,
      description: bump.description,
      priceLabel: bump.priceLabel,
      planId: bump.planId,
      badge: bump.badge ?? undefined,
      highlightColor: (bump.highlightColor as BumpFormState['highlightColor']) ?? undefined,
      position: bump.position,
      defaultSelected: bump.defaultSelected,
      sortIndex: index,
    }))
}

function serializePayload(state: FormState): CompanyConfigInput {
  return {
    headline: state.headline,
    subheadline: state.subheadline,
    ctaText: state.ctaText,
    basePlanId: state.basePlanId,
    redirectUrl: state.redirectEnabled ? state.redirectUrl || null : null,
    webhookUrl: state.webhookEnabled ? state.webhookUrl || null : null,
    allowPrefill: state.allowPrefill,
    theme: state.theme,
    accent: state.accent,
    showBadges: state.showBadges,
    bumps: state.bumps.map((bump, index) => ({
      id: bump.id,
      title: bump.title,
      description: bump.description,
      priceLabel: bump.priceLabel,
      planId: bump.planId,
      badge: bump.badge,
      highlightColor: bump.highlightColor,
      position: bump.position,
      defaultSelected: bump.defaultSelected,
      sortIndex: index,
    })),
  }
}

interface FormState {
  headline: string
  subheadline: string
  ctaText: string
  basePlanId: string
  redirectUrl: string
  redirectEnabled: boolean
  webhookUrl: string
  webhookEnabled: boolean
  allowPrefill: boolean
  theme: (typeof THEMES)[number]
  accent: (typeof ACCENTS)[number]
  showBadges: boolean
  bumps: BumpFormState[]
}

const defaultBump = (sortIndex: number): BumpFormState => ({
  title: 'Order bump',
  description: 'Add a irresistible bonus to increase average order value.',
  priceLabel: 'Only $17',
  planId: '',
  badge: '',
  highlightColor: undefined,
  position: 'below',
  defaultSelected: false,
  sortIndex,
})

function buildFormState(config: DashboardConfig): FormState {
  return {
    headline: config.headline ?? '',
    subheadline: config.subheadline ?? '',
    ctaText: config.ctaText ?? 'Checkout',
    basePlanId: config.basePlanId ?? '',
    redirectUrl: config.redirectUrl ?? '',
    redirectEnabled: Boolean(config.redirectUrl),
    webhookUrl: config.webhookUrl ?? '',
    webhookEnabled: Boolean(config.webhookUrl),
    allowPrefill: config.allowPrefill,
    theme: config.theme,
    accent: config.accent,
    showBadges: config.showBadges,
    bumps: normalizeBumps(config.bumps),
  }
}

export function DashboardForm({ companyId, initialConfig }: Props) {
  const [formState, setFormState] = useState<FormState>(() => buildFormState(initialConfig))
  const [baselinePayload, setBaselinePayload] = useState(() =>
    JSON.stringify(serializePayload(buildFormState(initialConfig)))
  )
  const [clientErrors, setClientErrors] = useState<FieldErrors>({})
  const [serverErrors, setServerErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const payload = useMemo(() => serializePayload(formState), [formState])

  const validation = useMemo(() => parseCompanyConfigPayload(payload), [payload])

  useEffect(() => {
    if (validation.success) {
      setClientErrors({})
    } else {
      const errors: FieldErrors = {}
      for (const issue of validation.error.issues) {
        const path = issue.path.join('.')
        errors[path] = issue.message
      }
      setClientErrors(errors)
    }
  }, [validation])

  const isValid = validation.success

  const serializedCurrent = JSON.stringify(payload)
  const isDirty = baselinePayload !== serializedCurrent

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const fieldErrors = { ...clientErrors, ...serverErrors }

  const bumpErrors: Array<Record<string, string>> = formState.bumps.map((_, index) => {
    const base = `bumps.${index}`
    const entries = Object.entries(fieldErrors).filter(([key]) => key.startsWith(base))
    return entries.reduce<Record<string, string>>((acc, [key, value]) => {
      const field = key.replace(`${base}.`, '')
      acc[field] = value
      return acc
    }, {})
  })

  const handleFieldChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }))
    setServerErrors({})
  }

  const handleBumpChange = (index: number, updates: Partial<BumpFormState>) => {
    setFormState((prev) => {
      const next = [...prev.bumps]
      next[index] = { ...next[index], ...updates }
      return { ...prev, bumps: next }
    })
    setServerErrors({})
  }

  const handleSelectDefault = (index: number) => {
    setFormState((prev) => {
      const next = prev.bumps.map((bump, idx) => ({
        ...bump,
        defaultSelected: idx === index,
      }))
      return { ...prev, bumps: next }
    })
  }

  const handleAddBump = () => {
    setFormState((prev) => {
      if (prev.bumps.length >= 3) {
        return prev
      }
      return {
        ...prev,
        bumps: [...prev.bumps, defaultBump(prev.bumps.length)],
      }
    })
  }

  const handleRemoveBump = (index: number) => {
    setFormState((prev) => {
      const next = prev.bumps.filter((_, idx) => idx !== index).map((bump, idx) => ({
        ...bump,
        sortIndex: idx,
        defaultSelected: idx === 0 ? bump.defaultSelected : bump.defaultSelected,
      }))
      return { ...prev, bumps: next }
    })
  }

  const handleMoveBump = (index: number, direction: 'up' | 'down') => {
    setFormState((prev) => {
      const next = [...prev.bumps]
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= next.length) return prev
      const temp = next[target]
      next[target] = next[index]
      next[index] = temp
      return {
        ...prev,
        bumps: next.map((bump, idx) => ({
          ...bump,
          sortIndex: idx,
        })),
      }
    })
  }

  const checkoutLink = `${HREF_ORIGIN}/checkout/${companyId}`.replace(/\/\//g, '://')

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(checkoutLink)
      setMessage('Checkout link copied to clipboard')
    } catch {
      setMessage('Copy failed. Please copy manually.')
    }
  }

  const handleSubmit = async () => {
    if (!isValid) return
    setStatus('saving')
    setMessage(null)
    setServerErrors({})

    startTransition(async () => {
      const response = await fetch(`/api/company/${companyId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        setStatus('error')
        try {
          const body = await response.json()
          if (body?.error?.fields) {
            setServerErrors(body.error.fields)
          }
          setMessage(body?.error?.message ?? 'Unable to save configuration')
        } catch {
          setMessage('Unable to save configuration')
        }
        return
      }

      const data = await response.json()
      setStatus('success')
      setMessage('Configuration saved')

      const nextConfig: DashboardConfig = {
        companyId,
        headline: data.headline ?? '',
        subheadline: data.subheadline ?? '',
        ctaText: data.ctaText ?? 'Checkout',
        basePlanId: data.basePlanId ?? '',
        allowPrefill: data.allowPrefill ?? true,
        theme: data.theme ?? 'light',
        accent: data.accent ?? 'sky',
        showBadges: data.showBadges ?? false,
        redirectUrl: data.redirectUrl ?? '',
        webhookUrl: data.webhookUrl ?? '',
        bumps: (data.bumps ?? []) as DashboardConfig['bumps'],
      }

      const nextState = buildFormState(nextConfig)
      setFormState(nextState)
      setBaselinePayload(JSON.stringify(serializePayload(nextState)))
    })
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl shadow-slate-900/10">
        <header className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
            Brand & Wrapper
          </p>
          <h2 className="text-2xl font-semibold text-slate-900">
            Customize your hosted checkout page
          </h2>
          <p className="max-w-3xl text-sm text-slate-600">
            Headline, subheadline, theme, and trust badges apply to your hosted checkout page as well
            as the embed snippet we generate for you.
          </p>
        </header>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">
              Headline <span className="text-slate-400">(max 160)</span>
            </span>
            <input
              value={formState.headline}
              onChange={(event) => handleFieldChange('headline', sanitizeText(event.target.value, 160))}
              className={clsx(
                'w-full rounded-lg border px-3 py-2 text-sm outline-none transition',
                fieldErrors.headline ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-400'
              )}
            />
            {fieldErrors.headline ? (
              <span className="text-xs text-rose-500">{fieldErrors.headline}</span>
            ) : null}
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">
              Subheadline <span className="text-slate-400">(max 200)</span>
            </span>
            <textarea
              value={formState.subheadline}
              onChange={(event) =>
                handleFieldChange('subheadline', sanitizeText(event.target.value, 200))
              }
              className={clsx(
                'w-full min-h-[70px] rounded-lg border px-3 py-2 text-sm outline-none transition',
                fieldErrors.subheadline
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-200 focus:border-slate-400'
              )}
            />
            {fieldErrors.subheadline ? (
              <span className="text-xs text-rose-500">{fieldErrors.subheadline}</span>
            ) : null}
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">CTA text</span>
            <input
              value={formState.ctaText}
              onChange={(event) => handleFieldChange('ctaText', sanitizeText(event.target.value, 60))}
              className={clsx(
                'w-full rounded-lg border px-3 py-2 text-sm outline-none transition',
                fieldErrors.ctaText ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-400'
              )}
            />
            {fieldErrors.ctaText ? (
              <span className="text-xs text-rose-500">{fieldErrors.ctaText}</span>
            ) : null}
          </label>
          <div className="grid gap-4 md:grid-cols-2 md:items-end">
            <fieldset>
              <legend className="text-sm font-medium text-slate-700">Theme</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {THEMES.map((theme) => (
                  <label
                    key={theme}
                    className={clsx(
                      'flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm capitalize',
                      formState.theme === theme
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-slate-400'
                    )}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={theme}
                      checked={formState.theme === theme}
                      onChange={() => handleFieldChange('theme', theme)}
                      className="sr-only"
                    />
                    {theme}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Accent color</span>
              <select
                value={formState.accent}
                onChange={(event) => handleFieldChange('accent', event.target.value as (typeof ACCENTS)[number])}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
              >
                {ACCENTS.map((accent) => (
                  <option key={accent} value={accent}>
                    {accent.charAt(0).toUpperCase() + accent.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 md:col-span-2">
            <input
              type="checkbox"
              checked={formState.showBadges}
              onChange={(event) => handleFieldChange('showBadges', event.target.checked)}
              className="h-4 w-4 accent-slate-900"
            />
            Show trust badges under CTA
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl shadow-slate-900/10">
        <header className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Plans</p>
          <h2 className="text-2xl font-semibold text-slate-900">Configure base plan & bumps</h2>
          <p className="max-w-3xl text-sm text-slate-600">
            Enter the Whop plan ID for your base offer. Add up to three order bumps — each with
            their own plan ID — to let buyers upgrade before completing checkout.
          </p>
        </header>

        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Base plan ID</span>
            <input
              value={formState.basePlanId}
              onChange={(event) => handleFieldChange('basePlanId', event.target.value.trim())}
              className={clsx(
                'w-full rounded-lg border px-3 py-2 text-sm outline-none transition',
                fieldErrors.basePlanId ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-400'
              )}
              placeholder="plan_..."
            />
            {fieldErrors.basePlanId ? (
              <span className="text-xs text-rose-500">{fieldErrors.basePlanId}</span>
            ) : (
              <span className="text-xs text-slate-500">
                Must be a plan-based embed ID (plan_...). We recommend creating a dedicated bundle
                for each bump.
              </span>
            )}
          </label>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Order bumps</h3>
            <button
              type="button"
              onClick={handleAddBump}
              disabled={formState.bumps.length >= 3}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Add bump
            </button>
          </div>
          {formState.bumps.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
              No bumps yet. Add up to three to increase average order value. Buyers can only select
              one bump at a time.
            </p>
          ) : null}
          <div className="space-y-4">
            {formState.bumps.map((bump, index) => (
              <BumpEditor
                key={bump.id ?? index}
                index={index}
                total={formState.bumps.length}
                bump={bump}
                errors={bumpErrors[index] ?? {}}
                onChange={(updates) => handleBumpChange(index, updates)}
                onRemove={() => handleRemoveBump(index)}
                onMoveUp={() => handleMoveBump(index, 'up')}
                onMoveDown={() => handleMoveBump(index, 'down')}
                disableRemove={formState.bumps.length === 0}
                onSelectDefault={() => handleSelectDefault(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl shadow-slate-900/10">
        <header className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Prefill & Automations</p>
          <h2 className="text-2xl font-semibold text-slate-900">Speed up checkout and trigger workflows</h2>
          <p className="max-w-3xl text-sm text-slate-600">
            Enable URL prefill to reduce friction. Optionally redirect buyers to a thank-you page
            and forward successful payments to your automation webhook.
          </p>
        </header>

        <div className="space-y-4">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={formState.allowPrefill}
              onChange={(event) => handleFieldChange('allowPrefill', event.target.checked)}
              className="h-4 w-4 accent-slate-900"
            />
            Allow URL prefill (email, name, address)
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Redirect after purchase</span>
              <input
                type="url"
                value={formState.redirectUrl}
                onChange={(event) => handleFieldChange('redirectUrl', event.target.value)}
                className={clsx(
                  'w-full rounded-lg border px-3 py-2 text-sm outline-none transition',
                  fieldErrors.redirectUrl
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-200 focus:border-slate-400'
                )}
                placeholder="https://yourdomain.com/thank-you"
              />
              {fieldErrors.redirectUrl ? (
                <span className="text-xs text-rose-500">{fieldErrors.redirectUrl}</span>
              ) : (
                <span className="text-xs text-slate-500">
                  Buyers are redirected after we record payment. payment_id is appended as a query
                  parameter.
                </span>
              )}
              <label className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={formState.redirectEnabled}
                  onChange={(event) => handleFieldChange('redirectEnabled', event.target.checked)}
                  className="h-4 w-4 accent-slate-900"
                />
                Enable redirect
              </label>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Webhook URL</span>
              <input
                type="url"
                value={formState.webhookUrl}
                onChange={(event) => handleFieldChange('webhookUrl', event.target.value)}
                className={clsx(
                  'w-full rounded-lg border px-3 py-2 text-sm outline-none transition',
                  fieldErrors.webhookUrl
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-200 focus:border-slate-400'
                )}
                placeholder="https://yourdomain.com/whop-webhook"
              />
              {fieldErrors.webhookUrl ? (
                <span className="text-xs text-rose-500">{fieldErrors.webhookUrl}</span>
              ) : (
                <span className="text-xs text-slate-500">
                  We forward payment.succeeded events (with idempotency) to this endpoint.
                </span>
              )}
              <label className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={formState.webhookEnabled}
                  onChange={(event) => handleFieldChange('webhookEnabled', event.target.checked)}
                  className="h-4 w-4 accent-slate-900"
                />
                Forward payment.succeeded events
              </label>
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl shadow-slate-900/10">
        <header className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Generate</p>
          <h2 className="text-2xl font-semibold text-slate-900">Share or embed your checkout</h2>
          <p className="max-w-3xl text-sm text-slate-600">
            Use the hosted checkout link anywhere. The embed snippet opens your hosted page in a new
            tab, making it safe for any funnel builder.
          </p>
        </header>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <code className="rounde-lg flex-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
              {checkoutLink}
            </code>
            <button
              type="button"
              onClick={handleCopyLink}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-900/20"
            >
              Copy link
            </button>
            <a
              href={checkoutLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
            >
              Preview
            </a>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Embed snippet</p>
            <code className="mt-2 block overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {`<a href="${checkoutLink}" target="_blank" rel="noreferrer">Checkout</a>`}
            </code>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/80 px-6 py-4 shadow-xl shadow-slate-900/10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">
            {isDirty ? 'Unsaved changes' : 'All changes saved'}
          </p>
          {message ? (
            <p className={clsx('text-xs', status === 'error' ? 'text-rose-500' : 'text-emerald-600')}>
              {message}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || status === 'saving' || isPending}
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 transition disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {status === 'saving' || isPending ? 'Saving...' : 'Save configuration'}
        </button>
      </div>
    </div>
  )
}

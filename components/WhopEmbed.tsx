"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import Script from 'next/script'
import clsx from 'clsx'

const WHOP_LOADER = 'https://js.whop.com/static/checkout/loader.js'

const PREFILL_ATTRIBUTE_MAP: Record<string, string> = {
  email: 'data-whop-checkout-prefill-email',
  name: 'data-whop-checkout-prefill-name',
  country: 'data-whop-checkout-prefill-address-country',
  line1: 'data-whop-checkout-prefill-address-line1',
  line2: 'data-whop-checkout-prefill-address-line2',
  city: 'data-whop-checkout-prefill-address-city',
  state: 'data-whop-checkout-prefill-address-state',
  postal: 'data-whop-checkout-prefill-address-postal-code',
}

export type WhopPrefillMap = Partial<Record<keyof typeof PREFILL_ATTRIBUTE_MAP, string>>

interface Props {
  planId: string
  theme: 'light' | 'dark' | 'system'
  accent: string
  allowPrefill: boolean
  prefill: WhopPrefillMap
}

export function WhopEmbed({ planId, theme, accent, allowPrefill, prefill }: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    setIsLoading(true)
    wrapper.innerHTML = ''

    const embed = document.createElement('div')
    embed.className = 'whop-checkout-embed'
    embed.setAttribute('data-whop-checkout-plan-id', planId)
    embed.setAttribute('data-whop-checkout-theme', theme)
    embed.setAttribute('data-whop-checkout-theme-accent-color', accent)

    if (allowPrefill) {
      Object.entries(prefill).forEach(([key, value]) => {
        if (!value || typeof key !== 'string') return
        const attr = PREFILL_ATTRIBUTE_MAP[key as keyof WhopPrefillMap]
        if (attr) {
          embed.setAttribute(attr, value)
        }
      })
    }

    wrapper.appendChild(embed)

    const observer = new MutationObserver(() => {
      if (wrapper.querySelector('iframe')) {
        setIsLoading(false)
        observer.disconnect()
      }
    })

    observer.observe(wrapper, { childList: true, subtree: true })

    const attemptMount = () => {
      const mount = (window as any).WhopCheckout?.mount
      if (typeof mount === 'function') {
        mount()
        return true
      }
      return false
    }

    if (!attemptMount()) {
      let attempts = 0
      const timer = setInterval(() => {
        attempts += 1
        if (attemptMount() || attempts > 50) {
          clearInterval(timer)
        }
      }, prefersReducedMotion ? 200 : 120)
      return () => {
        clearInterval(timer)
        observer.disconnect()
      }
    }

    return () => {
      observer.disconnect()
    }
  }, [accent, allowPrefill, planId, prefill, theme, prefersReducedMotion])

  return (
    <div className="space-y-3">
      <Script src={WHOP_LOADER} strategy="lazyOnload" />
      <p
        className={clsx(
          'text-center text-xs text-slate-500 transition-opacity duration-150',
          !isLoading && 'opacity-0'
        )}
        aria-live="polite"
      >
        Loading secure Whop checkout…
      </p>
      <div
        ref={wrapperRef}
        id="whop-checkout-wrapper"
        aria-live="polite"
        className="whop-embed-wrapper"
      />
    </div>
  )
}

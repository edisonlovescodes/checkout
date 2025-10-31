"use client"

import { useEffect, useRef, useState } from 'react'

const WHOP_LOADER = 'https://js.whop.com/static/checkout/loader.js'

type PrefillMap = Partial<Record<'email' | 'name', string>>

function loadScript() {
  if (typeof window === 'undefined') return
  if (document.querySelector(`script[src="${WHOP_LOADER}"]`)) return
  const script = document.createElement('script')
  script.src = WHOP_LOADER
  script.async = true
  document.body.appendChild(script)
}

interface WhopEmbedProps {
  planId: string
  prefill: PrefillMap
}

export function WhopEmbed({ planId, prefill }: WhopEmbedProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadScript()
  }, [])

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    setLoading(true)
    wrapper.innerHTML = ''

    const embed = document.createElement('div')
    embed.className = 'whop-checkout-embed'
    embed.setAttribute('data-whop-checkout-plan-id', planId)

    if (prefill.email) {
      embed.setAttribute('data-whop-checkout-prefill-email', prefill.email)
    }
    if (prefill.name) {
      embed.setAttribute('data-whop-checkout-prefill-name', prefill.name)
    }

    wrapper.appendChild(embed)

    const observer = new MutationObserver(() => {
      if (wrapper.querySelector('iframe')) {
        setLoading(false)
        observer.disconnect()
      }
    })

    observer.observe(wrapper, { childList: true, subtree: true })

    const attemptMount = () => {
      const mount = (window as any)?.WhopCheckout?.mount
      if (typeof mount === 'function') {
        mount()
        return true
      }
      return false
    }

    if (!attemptMount()) {
      const timer = setInterval(() => {
        if (attemptMount()) {
          clearInterval(timer)
        }
      }, 150)
      return () => {
        clearInterval(timer)
        observer.disconnect()
      }
    }

    return () => {
      observer.disconnect()
    }
  }, [planId, prefill.email, prefill.name])

  return (
    <div className="relative">
      {loading ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/90">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-emerald-600">Loading secure checkout…</p>
        </div>
      ) : null}
      <div ref={wrapperRef} className="min-h-[400px] rounded-2xl border border-emerald-100 bg-white shadow-inner" />
      <style jsx>{`
        iframe {
          filter: brightness(0) invert(1);
        }
      `}</style>
    </div>
  )
}

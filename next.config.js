/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const csp = [
      "default-src 'self'",
      // Next.js requires inline runtime and eval in production unless you switch to nonce/hash strategy.
      // Allow Whop loader, inline/eval for Next, and blob: for next/image and runtime chunks.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://js.whop.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.whop.com",
      // Allow Whop to embed this app in an iframe from both apps.whop.com and its subdomains
      "frame-src https://*.whop.com https://*.apps.whop.com 'self'",
      "frame-ancestors https://whop.com https://apps.whop.com https://*.whop.com https://*.apps.whop.com 'self'",
      "form-action 'self'",
      "base-uri 'self'",
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
}

module.exports = nextConfig

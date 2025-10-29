export function buildCsp() {
  const policies: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", 'https://js.whop.com'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", 'https://api.whop.com'],
    'frame-src': ['https://*.whop.com', "'self'"],
    'frame-ancestors': ['https://*.whop.com', "'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  }

  return Object.entries(policies)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ')
}

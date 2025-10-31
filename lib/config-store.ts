export type CheckoutConfig = {
  companyId: string
  basePlanId: string
  bundlePlanId?: string
  bumpTitle?: string
  redirectUrl?: string
}

const configs = new Map<string, CheckoutConfig>()

export function saveConfig(config: CheckoutConfig) {
  configs.set(config.companyId, {
    ...config,
    bundlePlanId: config.bundlePlanId || '',
    bumpTitle: config.bumpTitle || '',
    redirectUrl: config.redirectUrl || '',
  })
}

export function getConfig(companyId: string) {
  return configs.get(companyId) ?? null
}

export function getCheckoutLink(baseUrl: string, companyId: string) {
  const trimmed = baseUrl.replace(/\/$/, '')
  return `${trimmed}/checkout/${companyId}`
}

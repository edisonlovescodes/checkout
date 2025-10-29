export interface PublicBump {
  id: string
  title: string
  description: string
  priceLabel: string
  planId: string
  badge?: string | null
  highlightColor?: string | null
  position: 'above' | 'below' | 'sidebar'
  defaultSelected: boolean
  sortIndex: number
}

export interface PublicCompanyConfig {
  companyId: string
  headline: string
  subheadline: string
  ctaText: string
  basePlanId: string
  allowPrefill: boolean
  theme: 'light' | 'dark' | 'system'
  accent: 'sky' | 'blue' | 'green' | 'purple' | 'amber'
  showBadges: boolean
  redirectUrl?: string | null
  bumps: PublicBump[]
}

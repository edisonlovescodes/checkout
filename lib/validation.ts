import { z } from 'zod'
import { sanitizeNullableText, sanitizeText, sanitizeUrl } from './sanitize'

export const THEMES = ['light', 'dark', 'system'] as const
export const ACCENTS = ['sky', 'blue', 'green', 'purple', 'amber'] as const
export const HIGHLIGHT_COLORS = ['rose', 'amber', 'emerald', 'sky', 'violet', 'slate'] as const
export const BUMP_POSITIONS = ['above', 'below', 'sidebar'] as const

const planIdSchema = z
  .string()
  .trim()
  .regex(/^plan_[a-zA-Z0-9_-]{6,64}$/, 'Plan ID must start with plan_ and contain 6-64 characters')

const httpsUrlSchema = z
  .string()
  .url('Must be a valid URL starting with https://')
  .refine((value) => value.startsWith('https://'), 'URL must start with https://')

const bumpInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(240),
  priceLabel: z.string().min(1).max(80),
  planId: planIdSchema,
  badge: z.string().max(40).optional().or(z.literal('').transform(() => undefined)),
  highlightColor: z.enum(HIGHLIGHT_COLORS).optional(),
  position: z.enum(BUMP_POSITIONS),
  defaultSelected: z.boolean().optional().default(false),
  sortIndex: z.number().int().min(0).max(10),
})

export const companyConfigInputSchema = z
  .object({
    headline: z.string().max(160).optional().default(''),
    subheadline: z.string().max(200).optional().default(''),
    ctaText: z.string().max(60).optional().default('Checkout'),
    basePlanId: planIdSchema,
    redirectUrl: z.string().optional().nullable(),
    webhookUrl: z.string().optional().nullable(),
    allowPrefill: z.boolean().optional().default(true),
    theme: z.enum(THEMES),
    accent: z.enum(ACCENTS),
    showBadges: z.boolean().optional().default(false),
    bumps: z.array(bumpInputSchema).max(3).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.redirectUrl) {
      const parsed = httpsUrlSchema.safeParse(data.redirectUrl)
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: parsed.error.issues[0]?.message ?? 'Invalid redirect URL',
          path: ['redirectUrl'],
        })
      }
    }

    if (data.webhookUrl) {
      const parsed = httpsUrlSchema.safeParse(data.webhookUrl)
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: parsed.error.issues[0]?.message ?? 'Invalid webhook URL',
          path: ['webhookUrl'],
        })
      }
    }

    const sortIndexes = new Set<number>()
    let defaults = 0
    for (const bump of data.bumps) {
      if (sortIndexes.has(bump.sortIndex)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Duplicate sortIndex detected',
          path: ['bumps', bump.sortIndex, 'sortIndex'],
        })
      }
      sortIndexes.add(bump.sortIndex)
      if (bump.defaultSelected) {
        defaults += 1
      }
      if (bump.sortIndex < 0 || bump.sortIndex >= data.bumps.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'sortIndex is out of range',
          path: ['bumps', bump.sortIndex, 'sortIndex'],
        })
      }
    }
    if (defaults > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only one bump can be selected by default',
        path: ['bumps'],
      })
    }
  })

export type CompanyConfigInput = z.infer<typeof companyConfigInputSchema>
export type BumpInput = z.infer<typeof bumpInputSchema>

export function sanitizeConfigInput(input: CompanyConfigInput) {
  const sanitizedBumps = input.bumps
    .map((bump) => ({
      ...bump,
      title: sanitizeText(bump.title, 80),
      description: sanitizeText(bump.description, 240),
      priceLabel: sanitizeText(bump.priceLabel, 80),
      badge: sanitizeNullableText(bump.badge, 40),
    }))
    .sort((a, b) => a.sortIndex - b.sortIndex)

  return {
    headline: sanitizeText(input.headline ?? '', 160),
    subheadline: sanitizeText(input.subheadline ?? '', 200),
    ctaText: sanitizeText(input.ctaText ?? 'Checkout', 60) || 'Checkout',
    basePlanId: input.basePlanId.trim(),
    redirectUrl: sanitizeUrl(input.redirectUrl),
    webhookUrl: sanitizeUrl(input.webhookUrl),
    allowPrefill: input.allowPrefill ?? true,
    theme: input.theme,
    accent: input.accent,
    showBadges: input.showBadges ?? false,
    bumps: sanitizedBumps.map((bump, index) => ({
      ...bump,
      sortIndex: index,
      badge: bump.badge,
    })),
  }
}

export function parseCompanyConfigPayload(payload: unknown) {
  return companyConfigInputSchema.safeParse(payload)
}

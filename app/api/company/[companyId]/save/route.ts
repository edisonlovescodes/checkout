import { NextRequest, NextResponse } from 'next/server'
import { createId } from '@paralleldrive/cuid2'
import prisma from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  parseCompanyConfigPayload,
  sanitizeConfigInput,
} from '@/lib/validation'
import { getRequestIp } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const companyId = params.companyId
  if (!companyId) {
    return NextResponse.json({ error: { message: 'companyId is required' } }, { status: 400 })
  }

  const forwardedCompanyId = request.headers.get('x-whop-company-id')
  if (!forwardedCompanyId || forwardedCompanyId !== companyId) {
    return NextResponse.json({ error: { message: 'Forbidden' } }, { status: 403 })
  }

  const ip = getRequestIp(request)
  if (!checkRateLimit(`${ip}:${companyId}`)) {
    return NextResponse.json({ error: { message: 'Too many requests' } }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: { message: 'Invalid JSON payload' } }, { status: 400 })
  }

  const result = parseCompanyConfigPayload(body)
  if (!result.success) {
    const fields: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const key = issue.path.join('.')
      fields[key] = issue.message
    }
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Validation failed',
          fields,
        },
      },
      { status: 400 }
    )
  }

  const sanitized = sanitizeConfigInput(result.data)

  const saved = await prisma.$transaction(async (tx) => {
    const existing = await tx.companyConfig.findUnique({
      where: { companyId },
      include: { bumps: true },
    })

    if (!existing) {
      const created = await tx.companyConfig.create({
        data: {
          companyId,
          headline: sanitized.headline,
          subheadline: sanitized.subheadline,
          ctaText: sanitized.ctaText,
          basePlanId: sanitized.basePlanId,
          redirectUrl: sanitized.redirectUrl,
          webhookUrl: sanitized.webhookUrl,
          allowPrefill: sanitized.allowPrefill,
          theme: sanitized.theme,
          accent: sanitized.accent,
          showBadges: sanitized.showBadges,
          bumps: {
            create: sanitized.bumps.map((bump, index) => ({
              id: bump.id ?? createId(),
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
          },
        },
        include: { bumps: { orderBy: { sortIndex: 'asc' } } },
      })
      return created
    }

    await tx.companyConfig.update({
      where: { id: existing.id },
      data: {
        headline: sanitized.headline,
        subheadline: sanitized.subheadline,
        ctaText: sanitized.ctaText,
        basePlanId: sanitized.basePlanId,
        redirectUrl: sanitized.redirectUrl,
        webhookUrl: sanitized.webhookUrl,
        allowPrefill: sanitized.allowPrefill,
        theme: sanitized.theme,
        accent: sanitized.accent,
        showBadges: sanitized.showBadges,
      },
    })

    const incomingIds = sanitized.bumps
      .map((bump) => bump.id)
      .filter((id): id is string => Boolean(id))

    if (incomingIds.length) {
      await tx.bump.deleteMany({
        where: {
          companyConfigId: existing.id,
          id: { notIn: incomingIds },
        },
      })
    } else {
      await tx.bump.deleteMany({ where: { companyConfigId: existing.id } })
    }

    for (let index = 0; index < sanitized.bumps.length; index += 1) {
      const bump = sanitized.bumps[index]
      if (bump.id && existing.bumps.some((existingBump) => existingBump.id === bump.id)) {
        await tx.bump.update({
          where: { id: bump.id },
          data: {
            title: bump.title,
            description: bump.description,
            priceLabel: bump.priceLabel,
            planId: bump.planId,
            badge: bump.badge,
            highlightColor: bump.highlightColor,
            position: bump.position,
            defaultSelected: bump.defaultSelected,
            sortIndex: index,
          },
        })
      } else {
        await tx.bump.create({
          data: {
            id: bump.id ?? createId(),
            companyConfigId: existing.id,
            title: bump.title,
            description: bump.description,
            priceLabel: bump.priceLabel,
            planId: bump.planId,
            badge: bump.badge,
            highlightColor: bump.highlightColor,
            position: bump.position,
            defaultSelected: bump.defaultSelected,
            sortIndex: index,
          },
        })
      }
    }

    return tx.companyConfig.findUnique({
      where: { companyId },
      include: { bumps: { orderBy: { sortIndex: 'asc' } } },
    })
  })

  if (!saved) {
    return NextResponse.json({ error: { message: 'Unable to save configuration' } }, { status: 500 })
  }

  return NextResponse.json({
    companyId: saved.companyId,
    headline: saved.headline,
    subheadline: saved.subheadline,
    ctaText: saved.ctaText,
    basePlanId: saved.basePlanId,
    redirectUrl: saved.redirectUrl,
    webhookUrl: saved.webhookUrl,
    allowPrefill: saved.allowPrefill,
    theme: saved.theme,
    accent: saved.accent,
    showBadges: saved.showBadges,
    bumps: saved.bumps.map((bump) => ({
      id: bump.id,
      title: bump.title,
      description: bump.description,
      priceLabel: bump.priceLabel,
      planId: bump.planId,
      badge: bump.badge,
      highlightColor: bump.highlightColor,
      position: bump.position,
      defaultSelected: bump.defaultSelected,
      sortIndex: bump.sortIndex,
    })),
  })
}

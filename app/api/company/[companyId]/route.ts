import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { companyId: string } }
) {
  const companyId = params.companyId

  if (!companyId) {
    return NextResponse.json({ error: { message: 'companyId is required' } }, { status: 400 })
  }

  const config = await prisma.companyConfig.findUnique({
    where: { companyId },
    include: {
      bumps: {
        orderBy: { sortIndex: 'asc' },
      },
    },
  })

  if (!config) {
    return NextResponse.json({ error: { message: 'Not found' } }, { status: 404 })
  }

  return NextResponse.json({
    companyId: config.companyId,
    headline: config.headline,
    subheadline: config.subheadline,
    ctaText: config.ctaText,
    basePlanId: config.basePlanId,
    allowPrefill: config.allowPrefill,
    theme: config.theme,
    accent: config.accent,
    showBadges: config.showBadges,
    redirectUrl: config.redirectUrl,
    bumps: config.bumps.map((bump) => ({
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

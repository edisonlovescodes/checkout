import { NextRequest, NextResponse } from 'next/server'
import { getConfig, saveConfig } from '@/lib/config-store'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const companyId = (formData.get('companyId') ?? '').toString().trim()
  if (!companyId) {
    return NextResponse.json({ ok: false, error: 'companyId is required' }, { status: 400 })
  }

  const basePlanId = (formData.get('basePlanId') ?? '').toString().trim()
  if (!basePlanId) {
    return NextResponse.json({ ok: false, error: 'basePlanId is required' }, { status: 400 })
  }

  saveConfig({
    companyId,
    basePlanId,
    bundlePlanId: (formData.get('bundlePlanId') ?? '').toString().trim(),
    bumpTitle: (formData.get('bumpTitle') ?? '').toString().trim(),
    redirectUrl: (formData.get('redirectUrl') ?? '').toString().trim(),
  })

  const redirectTarget = new URL(`/dashboard/${companyId}?saved=1`, request.url)
  return NextResponse.redirect(redirectTarget)
}

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get('id')
  if (!companyId) {
    return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })
  }

  return NextResponse.json(getConfig(companyId))
}

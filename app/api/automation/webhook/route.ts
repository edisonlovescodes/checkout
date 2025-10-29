import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'
import { getRequestIp } from '@/lib/auth'

const MAX_ATTEMPTS = 3

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request)
  if (!checkRateLimit(`webhook:${ip}`)) {
    return NextResponse.json({ error: { message: 'Too many requests' } }, { status: 429 })
  }

  let payload: { payment_id?: string; companyId?: string; event?: string }

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: { message: 'Invalid JSON body' } }, { status: 400 })
  }

  const paymentId = payload.payment_id?.trim()
  const companyId = payload.companyId?.trim()
  const event = payload.event?.trim() || 'payment.succeeded'

  if (!paymentId || !companyId) {
    return NextResponse.json(
      { error: { message: 'payment_id and companyId are required' } },
      { status: 400 }
    )
  }

  const config = await prisma.companyConfig.findUnique({ where: { companyId } })
  if (!config?.webhookUrl) {
    return NextResponse.json({ ok: true })
  }

  const existingLog = await prisma.webhookForwardLog.findUnique({
    where: {
      paymentId_companyId_event: {
        paymentId,
        companyId,
        event,
      },
    },
  })

  if (existingLog?.status === 'success') {
    return NextResponse.json({ ok: true })
  }

  let attempts = existingLog?.attempts ?? 0
  let lastStatus = existingLog?.status ?? 'pending'

  for (; attempts < MAX_ATTEMPTS; attempts += 1) {
    const delay = attempts === 0 ? 0 : 300 * 2 ** (attempts - 1)
    if (delay) {
      await sleep(delay)
    }
    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: paymentId,
          companyId,
          event,
        }),
      })

      lastStatus = `${response.status}`
      if (response.ok) {
        await prisma.webhookForwardLog.upsert({
          where: {
            paymentId_companyId_event: {
              paymentId,
              companyId,
              event,
            },
          },
          create: {
            paymentId,
            companyId,
            event,
            status: 'success',
            attempts: attempts + 1,
          },
          update: {
            status: 'success',
            attempts: attempts + 1,
          },
        })

        return NextResponse.json({ ok: true })
      }
    } catch (error) {
      console.error('[whop-checkout] webhook forward error', {
        paymentId,
        companyId,
        event,
        error,
      })
      lastStatus = 'error'
    }
  }

  await prisma.webhookForwardLog.upsert({
    where: {
      paymentId_companyId_event: {
        paymentId,
        companyId,
        event,
      },
    },
    create: {
      paymentId,
      companyId,
      event,
      status: lastStatus,
      attempts: attempts,
    },
    update: {
      status: lastStatus,
      attempts: attempts,
    },
  })

  return NextResponse.json({ ok: false, status: lastStatus }, { status: 502 })
}

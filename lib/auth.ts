import type { NextRequest } from 'next/server'
import Whop from '@whop/sdk'
import env from './env'

let client: Whop | null = null

export type AccessLevel = 'admin' | 'creator' | 'customer' | 'no_access'

export interface DashboardSession {
  userId: string
  companyId: string
  accessLevel: AccessLevel
}

function getWhopClient() {
  if (client) return client

  client = new Whop({
    apiKey: env.WHOP_API_KEY,
    appID: env.WHOP_APP_ID,
  })

  return client
}

export async function verifyDashboardRequest(
  request: NextRequest,
  companyId: string
): Promise<DashboardSession> {
  const token = request.headers.get('x-whop-user-token')

  if (!token) {
    throw new Error('Missing x-whop-user-token header')
  }

  const whop = getWhopClient()

  const verification = await whop.verifyUserToken(token).catch((error) => {
    throw new Error(error?.message ?? 'Invalid Whop user token')
  })

  const access = await whop.users
    .checkAccess(companyId, {
      id: verification.userId,
    })
    .catch((error) => {
      throw new Error(error?.message ?? 'Unable to verify access')
    })

  if (!access.has_access || !['admin', 'creator'].includes(access.access_level)) {
    throw new Error('Insufficient permissions')
  }

  return {
    userId: verification.userId,
    companyId,
    accessLevel: access.access_level as AccessLevel,
  }
}

export function getRequestIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim()
  }
  return request.ip ?? 'unknown'
}

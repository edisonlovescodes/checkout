import { NextRequest, NextResponse } from 'next/server'
import { verifyDashboardRequest } from './lib/auth'

const DASHBOARD_REGEX = /^\/dashboard\/(.+)/
const SAVE_REGEX = /^\/api\/company\/(.+?)\/save/

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const dashboardMatch = pathname.match(DASHBOARD_REGEX)
  const saveMatch = pathname.match(SAVE_REGEX)

  const companyId = dashboardMatch?.[1] ?? saveMatch?.[1]

  if (!companyId) {
    return NextResponse.next()
  }

  try {
    const session = await verifyDashboardRequest(request, companyId)
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-whop-company-id', session.companyId)
    requestHeaders.set('x-whop-user-id', session.userId)
    requestHeaders.set('x-whop-access-level', session.accessLevel)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: { message: (error as Error).message ?? 'Unauthorized' } },
      { status: 403 }
    )
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/company/:path*/save'],
}

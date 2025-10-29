import { NextRequest, NextResponse } from 'next/server'
import { verifyDashboardRequest } from './lib/auth'

const DASHBOARD_REGEX = /^\/dashboard\/(.+)/
const SAVE_REGEX = /^\/api\/company\/(.+?)\/save/

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const dashboardMatch = pathname.match(DASHBOARD_REGEX)
  const saveMatch = pathname.match(SAVE_REGEX)

  let companyId = dashboardMatch?.[1] ?? saveMatch?.[1]
  const headerCompanyId = request.headers.get('x-whop-company-id')
  const looksLikeBiz = (id?: string | null) => !!id && /^biz_[A-Za-z0-9]/.test(id)

  if (!companyId) {
    return NextResponse.next()
  }

  // For dashboard page requests: verify via Whop token and set a short-lived cookie to reuse
  if (dashboardMatch) {
    // If companyId param is malformed, try to recover from header or redirect to normalized URL
    if (!looksLikeBiz(companyId) && looksLikeBiz(headerCompanyId)) {
      companyId = headerCompanyId!
      const url = request.nextUrl.clone()
      url.pathname = `/dashboard/${companyId}`
      return NextResponse.redirect(url)
    }

    // If still malformed, let the page render so we can show a friendly message; do not block
    if (!looksLikeBiz(companyId)) {
      return NextResponse.next()
    }
    try {
      const session = await verifyDashboardRequest(request, companyId)
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-whop-company-id', session.companyId)
      requestHeaders.set('x-whop-user-id', session.userId)
      requestHeaders.set('x-whop-access-level', session.accessLevel)

      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
      // Persist company context for subsequent API calls made by the browser
      response.cookies.set('w_company', session.companyId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        maxAge: 60 * 30, // 30 minutes
        path: '/',
      })
      response.cookies.set('w_access', session.accessLevel, {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        maxAge: 60 * 30,
        path: '/',
      })
      return response
    } catch (error) {
      return NextResponse.json(
        { error: { message: (error as Error).message ?? 'Unauthorized' } },
        { status: 403 }
      )
    }
  }

  // For API save calls: allow if cookie matches path param (so client fetch works inside iframe)
  if (saveMatch) {
    const cookieCompany = request.cookies.get('w_company')?.value
    if (cookieCompany && cookieCompany === companyId) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-whop-company-id', companyId)
      return NextResponse.next({ request: { headers: requestHeaders } })
    }
    // Fallback: try full verification (e.g., if Whop also forwards token on API calls)
    try {
      const session = await verifyDashboardRequest(request, companyId)
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-whop-company-id', session.companyId)
      return NextResponse.next({ request: { headers: requestHeaders } })
    } catch (error) {
      return NextResponse.json(
        { error: { message: (error as Error).message ?? 'Unauthorized' } },
        { status: 403 }
      )
    }
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/company/:path*/save'],
}

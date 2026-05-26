import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const session = request.cookies.get('session')

  // If no session cookie, redirect to login
  if (!session?.value) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Protect all routes except /login and Next.js internals
  matcher: ['/((?!login|_next/static|_next/image|favicon\\.ico).*)'],
}

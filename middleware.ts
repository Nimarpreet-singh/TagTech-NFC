import { NextRequest, NextResponse } from 'next/server'

const PUBLIC = ['/', '/login', '/tap', '/classrooms']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths and API auth routes
  if (
    PUBLIC.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.match(/\.(png|jpg|jpeg|gif|ico|svg|webp)$/)
  ) {
    return NextResponse.next()
  }

  // Check if token exists, redirect to login if not
  const token = req.cookies.get('tagtech_token')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Token validation is deferred to API routes / page components
  // to avoid async operations in middleware
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

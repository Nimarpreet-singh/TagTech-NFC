import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

const PUBLIC = ['/', '/login', '/tap', '/classrooms']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // allow public paths and classroom routes
  if (
    PUBLIC.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get('tagtech_token')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const payload = await verifyToken(token)
  if (!payload) {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete('tagtech_token')
    return res
  }

  // role-based protection
  if (pathname.startsWith('/admin') && payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/teacher', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

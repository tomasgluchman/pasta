import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'pasta_auth'

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET env var is not set')
  return new TextEncoder().encode(secret)
}

async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return false
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) return false
    await jwtVerify(token, new TextEncoder().encode(secret))
    return true
  } catch {
    return false
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const method = req.method

  // Protect homepage
  if (pathname === '/') {
    if (!(await isAuthenticated(req))) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  }

  // Protect write API operations
  const isWriteApi =
    pathname.startsWith('/api/files') &&
    (method === 'POST' || method === 'PUT' || method === 'DELETE')

  if (isWriteApi) {
    if (!(await isAuthenticated(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/api/files', '/api/files/:path*'],
}

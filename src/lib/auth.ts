import { NextRequest } from 'next/server'
import { verifyToken } from './jwt'

export async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('tagtech_token')?.value
    || req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

export async function requireRole(req: NextRequest, ...roles: string[]) {
  const user = await getAuthUser(req)
  if (!user || !roles.includes(user.role as string)) return null
  return user
}

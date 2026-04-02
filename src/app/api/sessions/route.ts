import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Session } from '@/models/Session'
import { Classroom } from '@/models/Classroom'
import { requireRole } from '@/lib/auth'

// GET /api/sessions?classroomId=xxx
export async function GET(req: NextRequest) {
  const user = await requireRole(req, 'admin', 'teacher')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const classroomId = req.nextUrl.searchParams.get('classroomId')
  if (!classroomId) return NextResponse.json({ error: 'classroomId required' }, { status: 400 })

  await connectDB()
  const session = await Session.findOne({ classroomId })
  if (!session) return NextResponse.json({ session: null })

  // check if expired
  if (session.expiresAt && session.expiresAt < new Date()) {
    await Session.deleteOne({ classroomId })
    return NextResponse.json({ session: null })
  }
  return NextResponse.json({ session })
}

// POST /api/sessions - activate a link
export async function POST(req: NextRequest) {
  const user = await requireRole(req, 'teacher', 'admin')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { classroomId, url, durationMinutes } = await req.json()
  if (!classroomId || !url) return NextResponse.json({ error: 'classroomId and url required' }, { status: 400 })

  await connectDB()

  // verify teacher is assigned to this classroom
  if (user.role === 'teacher') {
    const classroom = await Classroom.findById(classroomId)
    if (!classroom || !classroom.teacherEmails.includes(user.email))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let expiresAt: Date | null = null
  if (durationMinutes && durationMinutes > 0) {
    expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000)
  }

  const session = await Session.findOneAndUpdate(
    { classroomId },
    { url, activatedBy: user.email as string, activatedAt: new Date(), expiresAt, tapCount: 0 },
    { upsert: true, new: true }
  )

  return NextResponse.json({ session })
}

// DELETE /api/sessions?classroomId=xxx - reset link
export async function DELETE(req: NextRequest) {
  const user = await requireRole(req, 'teacher', 'admin')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const classroomId = req.nextUrl.searchParams.get('classroomId')
  if (!classroomId) return NextResponse.json({ error: 'classroomId required' }, { status: 400 })

  await connectDB()
  await Session.deleteOne({ classroomId })
  return NextResponse.json({ ok: true })
}

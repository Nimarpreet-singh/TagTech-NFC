import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Classroom } from '@/models/Classroom'
import { Session } from '@/models/Session'
import { requireRole } from '@/lib/auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireRole(req, 'admin')
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  await Classroom.findByIdAndDelete(params.id)
  await Session.deleteOne({ classroomId: params.id })
  return NextResponse.json({ ok: true })
}

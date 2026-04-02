import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Classroom } from '@/models/Classroom'
import { Session } from '@/models/Session'
import { User } from '@/models/User'
import { requireRole } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: { id: string }}) {
  const admin = await requireRole(req, 'admin')
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const classroomId = params.id
  if (!classroomId) return NextResponse.json({ error: 'classroom id required' }, { status: 400 })

  await connectDB()

  const classroom = await Classroom.findById(classroomId)
  if (!classroom) return NextResponse.json({ error: 'Classroom not found' }, { status: 404 })

  // Remove any active session for this classroom
  await Session.deleteMany({ classroomId: classroom._id.toString() })

  // Remove classroom reference from teachers
  await User.updateMany(
    { classroomIds: classroom._id.toString() },
    { $pull: { classroomIds: classroom._id.toString() } }
  )

  // Delete classroom
  await Classroom.deleteOne({ _id: classroom._id })

  return NextResponse.json({ ok: true })
}

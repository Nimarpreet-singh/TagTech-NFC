import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { Classroom } from '@/models/Classroom'
import { Session } from '@/models/Session'

interface PageProps {
  params: { id: string }
}

export default async function StudentTapPage({ params }: PageProps) {
  const { id } = params

  await connectDB()

  // find classroom by identifier
  const classroom = await Classroom.findOne({ identifier: id })

  if (!classroom) {
    redirect('/tap/not-found')
  }

  // check active session
  const session = await Session.findOne({ classroomId: classroom._id.toString() })

  if (!session) {
    redirect('/tap/inactive?room=' + encodeURIComponent(classroom.name))
  }

  // check expiry
  if (session.expiresAt && session.expiresAt < new Date()) {
    await Session.deleteOne({ classroomId: classroom._id.toString() })
    redirect('/tap/inactive?room=' + encodeURIComponent(classroom.name))
  }

  // increment tap count (fire and forget)
  Session.findByIdAndUpdate(session._id, { $inc: { tapCount: 1 } }).exec()

  // redirect student to the active URL
  redirect(session.url)
}
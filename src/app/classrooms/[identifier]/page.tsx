import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { Classroom } from '@/models/Classroom'
import { Session } from '@/models/Session'
import { headers } from 'next/headers'

interface PageProps {
  params: { identifier: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function ClassroomPage({ params, searchParams }: PageProps) {
  const { identifier } = params
  const isTeacher = searchParams.teacher === 'true'

  await connectDB()

  // find classroom by identifier
  const classroom = await Classroom.findOne({ identifier })

  if (!classroom) {
    redirect('/tap/not-found')
  }

  // teacher access → redirect to login
  if (isTeacher) {
    redirect(`/login?redirect=/teacher&classroom=${identifier}`)
  }

  // student access → check active session
  const session = await Session.findOne({ classroomId: classroom._id.toString() })

  if (!session) {
    redirect(`/tap/inactive?room=${encodeURIComponent(classroom.name)}`)
  }

  // check expiry
  if (session.expiresAt && session.expiresAt < new Date()) {
    await Session.deleteOne({ classroomId: classroom._id.toString() })
    redirect(`/tap/inactive?room=${encodeURIComponent(classroom.name)}`)
  }

  // increment tap count (fire and forget)
  Session.findByIdAndUpdate(session._id, { $inc: { tapCount: 1 } }).exec()

  // redirect student to the active URL
  redirect(session.url)
}
import { redirect } from 'next/navigation'

interface PageProps {
  params: { id: string }
}

export default function TeacherTapPage({ params }: PageProps) {
  // redirect to login with redirect to teacher dashboard
  redirect('/login?redirect=/teacher')
}
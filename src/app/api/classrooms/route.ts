import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Classroom } from '@/models/Classroom'
import { User } from '@/models/User'
import { requireRole } from '@/lib/auth'
import bcrypt from 'bcryptjs'

function generateIdentifier(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // remove special chars
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-') // remove multiple hyphens
    .replace(/^-|-$/g, '') // remove leading/trailing hyphens
}

// GET /api/classrooms - list all (admin) or assigned (teacher)
export async function GET(req: NextRequest) {
  const user = await requireRole(req, 'admin', 'teacher')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const filter = user.role === 'teacher' ? { teacherEmails: user.email } : {}
  const classrooms = await Classroom.find(filter).sort({ createdAt: -1 })
  return NextResponse.json({ classrooms })
}

// POST /api/classrooms - create (admin only)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(req, 'admin')
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, teacherName, teacherEmail, teacherPassword } = await req.json()
    if (!name || !teacherEmail || !teacherPassword)
      return NextResponse.json({ error: 'name, teacherEmail, teacherPassword required' }, { status: 400 })

    await connectDB()

    const identifier = generateIdentifier(name)

    // check if identifier already exists
    const existing = await Classroom.findOne({ identifier })
    if (existing) return NextResponse.json({ error: 'Classroom name conflicts with existing identifier' }, { status: 400 })

    const classroom = await Classroom.create({
      name,
      identifier,
      studentSlug: identifier,
      teacherSlug: `${identifier}-teacher`,
      teacherEmails: [teacherEmail.toLowerCase()],
    })

    // create teacher user if not exists
    const exists = await User.findOne({ email: teacherEmail.toLowerCase() })
    if (!exists) {
      const passwordHash = await bcrypt.hash(teacherPassword, 10)
      await User.create({
        name: teacherName || teacherEmail.split('@')[0],
        email: teacherEmail.toLowerCase(),
        passwordHash,
        role: 'teacher',
        classroomIds: [classroom._id.toString()],
      })
    } else {
      // add classroom to existing teacher's classroomIds
      await User.findOneAndUpdate(
        { email: teacherEmail.toLowerCase() },
        { $addToSet: { classroomIds: classroom._id.toString() } }
      )
    }

    return NextResponse.json({ classroom }, { status: 201 })
  } catch (err) {
    console.error('Classroom POST error', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

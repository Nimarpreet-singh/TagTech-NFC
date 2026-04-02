'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Classroom {
  _id: string
  name: string
  identifier: string
  teacherEmails: string[]
  createdAt: string
}

const BASE = process.env.NEXT_PUBLIC_BASE_URL || ''

function classroomUrl(identifier: string, type: 'student' | 'teacher') {
  const baseUrl = `${BASE}/classrooms/${identifier}`
  return type === 'teacher' ? `${baseUrl}?teacher=true` : baseUrl
}

export default function AdminPage() {
  const router = useRouter()
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  // new classroom form
  const [name, setName] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [teacherEmail, setTeacherEmail] = useState('')
  const [teacherPassword, setTeacherPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  const load = useCallback(async () => {
    const res = await fetch('/api/classrooms')
    if (res.status === 401) { router.push('/login'); return }
    const data = await res.json()
    setClassrooms(data.classrooms || [])
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  async function createClassroom(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setCreating(true)
    const res = await fetch('/api/classrooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, teacherName, teacherEmail, teacherPassword }),
    })
    const data = await res.json()
    if (!res.ok) { setFormError(data.error || 'Failed'); setCreating(false); return }
    setName(''); setTeacherName(''); setTeacherEmail(''); setTeacherPassword('')
    setCreating(false)
    showToast('Classroom created')
    load()
  }

  async function deleteClassroom(id: string, roomName: string) {
    if (!confirm(`Delete "${roomName}"? This also clears its active session.`)) return
    await fetch(`/api/classrooms/${id}`, { method: 'DELETE' })
    showToast('Classroom removed')
    load()
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {})
    showToast('Copied')
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
      Loading…
    </div>
  )

  return (
    <>
      <div className="topbar">
        <div className="logo"><span className="logo-dot" />TagTech</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="tag tag-admin">Admin</span>
          <button className="btn btn-sm" onClick={logout}>Sign out</button>
        </div>
      </div>

      <div className="main">
        <h1 className="page-title">Admin dashboard</h1>
        <p className="page-sub">Manage classrooms and NFC tag URLs</p>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat"><div className="stat-label">Classrooms</div><div className="stat-value">{classrooms.length}</div></div>
          <div className="stat"><div className="stat-label">Teachers</div><div className="stat-value">{new Set(classrooms.flatMap(c => c.teacherEmails)).size}</div></div>
          <div className="stat"><div className="stat-label">NFC endpoints</div><div className="stat-value">{classrooms.length * 2}</div></div>
        </div>

        {/* Classroom list */}
        {classrooms.length > 0 && (
          <>
            <div className="section-title" style={{ marginBottom: 10 }}>Classrooms</div>
            <div className="room-grid">
              {classrooms.map(room => (
                <div className="room-card" key={room._id}>
                  <div className="room-name">{room.name}</div>
                  <div className="room-teacher">{room.teacherEmails.join(', ')}</div>
                  <div className="slug-row">
                    <span className="slug-label">Student</span>
                    <span className="slug-val">{classroomUrl(room.identifier, 'student')}</span>
                    <button className="copy-btn" onClick={() => copy(classroomUrl(room.identifier, 'student'))}>Copy</button>
                  </div>
                  <div className="slug-row">
                    <span className="slug-label">Teacher</span>
                    <span className="slug-val">{classroomUrl(room.identifier, 'teacher')}</span>
                    <button className="copy-btn" onClick={() => copy(classroomUrl(room.identifier, 'teacher'))}>Copy</button>
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm btn-danger" style={{ flex: 1 }} onClick={() => deleteClassroom(room._id, room.name)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Add classroom */}
        <div className="section">
          <div className="section-title">Add new classroom</div>
          <form onSubmit={createClassroom}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              <div className="field">
                <label>Classroom name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Room 204" required />
              </div>
              <div className="field">
                <label>Teacher name</label>
                <input value={teacherName} onChange={e => setTeacherName(e.target.value)} placeholder="Ms Priya" />
              </div>
              <div className="field">
                <label>Teacher email</label>
                <input type="email" value={teacherEmail} onChange={e => setTeacherEmail(e.target.value)} placeholder="teacher@school.edu" required />
              </div>
              <div className="field">
                <label>Teacher password</label>
                <input type="password" value={teacherPassword} onChange={e => setTeacherPassword(e.target.value)} placeholder="Set login password" required />
              </div>
            </div>
            {formError && <p className="error-msg" style={{ marginBottom: 10 }}>{formError}</p>}
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Creating…' : 'Create classroom'}
            </button>
          </form>
        </div>

        <div className="section" style={{ background: 'var(--bg)' }}>
          <div className="section-title">How NFC tags work</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Each classroom gets two permanent URLs — one for student benches, one for the teacher bench.
            Write the <strong>student URL</strong> to all NFC tags on student benches.
            Write the <strong>teacher URL</strong> to the teacher bench tag.
            These URLs never change. Teachers update the link that students are redirected to from their dashboard.
          </p>
        </div>
      </div>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </>
  )
}

'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Session {
  _id: string
  url: string
  activatedAt: string
  expiresAt: string | null
  tapCount: number
}

interface Classroom {
  _id: string
  name: string
  identifier: string
  teacherEmails: string[]
}

interface Me {
  id: string
  name: string
  email: string
  role: string
  classroomIds: string[]
}

const BASE = process.env.NEXT_PUBLIC_BASE_URL || ''

export default function TeacherPage() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('')
  const [session, setSession] = useState<Session | null>(null)
  const [url, setUrl] = useState('')
  const [duration, setDuration] = useState('5')
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [toast, setToast] = useState('')
  const [timeLeft, setTimeLeft] = useState<string>('—')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  // poll session for selected classroom
  const pollSession = useCallback(async (classroomId: string) => {
    if (!classroomId) return
    const res = await fetch(`/api/sessions?classroomId=${classroomId}`)
    if (!res.ok) return
    const data = await res.json()
    setSession(data.session)
  }, [])

  useEffect(() => {
    async function init() {
      // get current user
      const meRes = await fetch('/api/auth/me')
      if (!meRes.ok) { router.push('/login'); return }
      const meData = await meRes.json()
      const user: Me = meData.user
      setMe(user)

      if (user.classroomIds.length === 0) {
        setLoading(false)
        return
      }

      // get classrooms assigned to teacher
      const cRes = await fetch('/api/classrooms')
      const cData = await cRes.json()
      const assignedClassrooms = (cData.classrooms as Classroom[]).filter(c => user.classroomIds.includes(c._id))
      setClassrooms(assignedClassrooms)

      // select first classroom by default
      if (assignedClassrooms.length > 0) {
        setSelectedClassroomId(assignedClassrooms[0]._id)
        await pollSession(assignedClassrooms[0]._id)
      }

      setLoading(false)
    }
    init()
  }, [router, pollSession])

  // when selected classroom changes, poll its session
  useEffect(() => {
    if (selectedClassroomId) {
      pollSession(selectedClassroomId)
    }
  }, [selectedClassroomId, pollSession])

  // live countdown
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!session?.expiresAt) { setTimeLeft(session ? '∞' : '—'); return }

    function tick() {
      if (!session?.expiresAt) return
      const diff = new Date(session.expiresAt).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Expired'); setSession(null); return }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${m}:${String(s).padStart(2, '0')}`)
    }
    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [session])

  // poll every 10s for selected classroom
  useEffect(() => {
    if (!selectedClassroomId) return
    const id = setInterval(() => pollSession(selectedClassroomId), 10000)
    return () => clearInterval(id)
  }, [selectedClassroomId, pollSession])

  async function activateLink() {
    if (!selectedClassroomId || !url.trim()) return
    setActivating(true)
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classroomId: selectedClassroomId,
        url: url.trim(),
        durationMinutes: parseInt(duration) || 0,
      }),
    })
    const data = await res.json()
    if (res.ok) { setSession(data.session); setUrl(''); showToast('Link activated') }
    else showToast(data.error || 'Failed')
    setActivating(false)
  }

  async function resetLink() {
    if (!selectedClassroomId) return
    if (!confirm('Reset the active link? Students will see "no active link".')) return
    await fetch(`/api/sessions?classroomId=${selectedClassroomId}`, { method: 'DELETE' })
    setSession(null)
    showToast('Link reset')
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {})
    showToast('Copied')
  }

  const selectedClassroom = classrooms.find(c => c._id === selectedClassroomId)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
      Loading…
    </div>
  )

  if (classrooms.length === 0) return (
    <div className="page-wrap">
      <div className="card" style={{ maxWidth: 400, textAlign: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No classrooms assigned</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Ask your admin to assign you to classrooms.</p>
        <button className="btn" onClick={logout}>Sign out</button>
      </div>
    </div>
  )

  return (
    <>
      <div className="topbar">
        <div className="logo"><span className="logo-dot" />TagTech</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{me?.name}</span>
          <span className="tag tag-teacher">Teacher</span>
          <button className="btn btn-sm" onClick={logout}>Sign out</button>
        </div>
      </div>

      <div className="main">
        <h1 className="page-title">Teacher Dashboard</h1>
        <p className="page-sub">Manage active links for your classrooms</p>

        {/* Classroom Selector */}
        <div className="section">
          <div className="section-title">Select Classroom</div>
          <select
            value={selectedClassroomId}
            onChange={e => setSelectedClassroomId(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 4 }}
          >
            {classrooms.map(room => (
              <option key={room._id} value={room._id}>{room.name}</option>
            ))}
          </select>
        </div>

        {selectedClassroom && (
          <>
            {/* Stats */}
            <div className="stats-grid">
              <div className="stat">
                <div className="stat-label">Session</div>
                <div className="stat-value" style={{ fontSize: 16, paddingTop: 4 }}>
                  {session ? <span style={{ color: 'var(--green)' }}>● Live</span> : <span style={{ color: 'var(--text-faint)' }}>○ None</span>}
                </div>
              </div>
              <div className="stat">
                <div className="stat-label">Time left</div>
                <div className="stat-value" style={{ fontSize: session ? 22 : 16 }}>{timeLeft}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Taps today</div>
                <div className="stat-value">{session?.tapCount ?? 0}</div>
              </div>
            </div>

            {/* Activate link */}
            <div className="section">
              <div className="section-title">Share a link for {selectedClassroom.name}</div>
              <div className="url-row">
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="Paste link — Google Slides, PDF, any URL…"
                  onKeyDown={e => e.key === 'Enter' && activateLink()}
                />
                <button className="btn btn-primary" onClick={activateLink} disabled={activating || !url.trim()}>
                  {activating ? 'Activating…' : 'Activate'}
                </button>
              </div>
              <div className="timer-row">
                <label>Duration:</label>
                <select value={duration} onChange={e => setDuration(e.target.value)}>
                  <option value="2">2 minutes</option>
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="0">No expiry</option>
                </select>
                {session && (
                  <button className="btn btn-sm btn-danger" onClick={resetLink}>
                    Reset link
                  </button>
                )}
              </div>

              {session ? (
                <div className="active-session">
                  <div className="as-label">Active link</div>
                  <div className="as-url">{session.url}</div>
                  <div className="as-timer">
                    {session.expiresAt ? `Expires in ${timeLeft}` : 'No expiry set'}
                    {' · '}
                    Activated {new Date(session.activatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ) : (
                <div className="no-session">
                  <p>No active link. Students will see a &ldquo;no active link&rdquo; message when they tap.</p>
                </div>
              )}
            </div>

            {/* Student NFC URL */}
            <div className="section">
              <div className="section-title">Student NFC tag URL for {selectedClassroom.name}</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                This URL is written to every student bench NFC tag. It never changes — only your active link above changes.
              </p>
              <div className="slug-row">
                <span className="slug-label">Student</span>
                <span className="slug-val" style={{ fontSize: 12 }}>{`${BASE}/classrooms/${selectedClassroom.identifier}`}</span>
                <button className="copy-btn" onClick={() => copy(`${BASE}/classrooms/${selectedClassroom.identifier}`)}>Copy</button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8 }}>
                Tap flow: NFC tag → TagTech → checks active link → redirects student instantly
              </p>
            </div>
          </>
        )}
      </div>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </>
  )
}

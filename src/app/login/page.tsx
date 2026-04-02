'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get('redirect') || ''
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return }
      const role = data.user.role
      if (redirect) router.push(redirect)
      else if (role === 'admin') router.push('/admin')
      else router.push('/teacher')
    } catch {
      setError('Network error')
      setLoading(false)
    }
  }

  return (
    <div className="page-wrap">
      <div className="card" style={{ width: '100%', maxWidth: 380 }}>
        <div className="logo" style={{ marginBottom: '1.5rem' }}>
          <span className="logo-dot" />
          TagTech
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          NFC-powered link delivery for classrooms
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email" value={email} required autoFocus
              placeholder="you@school.edu"
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password" value={password} required
              placeholder="••••••••"
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

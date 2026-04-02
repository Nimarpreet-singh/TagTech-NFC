import { Suspense } from 'react'

function InactiveContent() {
  return (
    <div className="page-wrap">
      <div className="card" style={{ maxWidth: 360, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📵</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No active link</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Your teacher hasn&apos;t shared anything yet, or the session has expired.
          Try tapping again in a moment.
        </p>
        <div style={{ marginTop: 20, padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-faint)' }}>
          Powered by TagTech
        </div>
      </div>
    </div>
  )
}

export default function TapInactivePage() {
  return (
    <Suspense fallback={null}>
      <InactiveContent />
    </Suspense>
  )
}

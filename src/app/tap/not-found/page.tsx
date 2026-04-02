export default function TapNotFoundPage() {
  return (
    <div className="page-wrap">
      <div className="card" style={{ maxWidth: 360, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Tag not found</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          This NFC tag isn&apos;t registered in the system. Contact your administrator.
        </p>
      </div>
    </div>
  )
}

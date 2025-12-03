import React, {useEffect, useState} from 'react'

function formatTime(date, military) {
  const opts = {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: !military,
  }
  return new Intl.DateTimeFormat(undefined, opts).format(date)
}

export default function AppFooter() {
  const [military, setMilitary] = useState(true)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <footer className="app-footer">
      <div className="footer-left" role="button" tabIndex={0} onClick={() => setMilitary((m) => !m)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setMilitary((m) => !m)}>
        <span className="footer-time-label">{military ? '24h' : '12h'}</span>
        <span className="footer-time-value">{formatTime(now, military)}</span>
      </div>
      <div className="footer-center">© {new Date().getFullYear()} Nimbus — Protected IP</div>
      <div className="footer-right">Enterprise grade · Buyer ready</div>
    </footer>
  )
}

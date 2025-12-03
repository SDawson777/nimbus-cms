import React, {useEffect, useMemo, useState} from 'react'
import {useAdmin} from '../lib/adminContext'
import {apiJson, apiBaseUrl} from '../lib/api'
import {motion, AnimatePresence} from 'framer-motion'

const FALLBACK_BANNER = {
  weather: {tempF: 72, condition: 'Partly Cloudy', icon: '⛅️'},
  ticker: [
    {label: 'Active users', value: '1,204', delta: 12, direction: 'up'},
    {label: 'Conversion', value: '4.8%', delta: -3, direction: 'down'},
    {label: 'Top store', value: 'Detroit – 8 Mile', delta: 19, direction: 'up'},
  ],
  serverTime: new Date().toISOString(),
}

function formatTime(date, format) {
  const opts = {hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: format === '12h'}
  return new Intl.DateTimeFormat(undefined, opts).format(date)
}

export default function AdminBanner() {
  const {admin} = useAdmin()
  const [banner, setBanner] = useState(FALLBACK_BANNER)
  const [clockFormat, setClockFormat] = useState('24h')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        if (!apiBaseUrl()) {
          setBanner((prev) => ({...prev, adminName: admin?.email || 'Nimbus Admin'}))
          return
        }
        const {ok, data} = await apiJson('/api/admin/banner')
        if (mounted && ok && data) {
          setBanner({...FALLBACK_BANNER, ...data})
        }
      } catch (e) {
        // ignore and keep fallback
      }
    }
    load()
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [admin])

  const tickerItems = useMemo(() => banner.ticker || FALLBACK_BANNER.ticker, [banner])

  return (
    <div className="admin-banner" role="banner" aria-label="Admin welcome and system status">
      <div className="banner-left">
        <div className="banner-welcome">Welcome back, {banner.adminName || admin?.email || 'Admin'}</div>
        <div className="banner-weather" aria-label="Current weather">
          <span className="banner-weather__icon" aria-hidden="true">
            {banner.weather?.icon || '⛅️'}
          </span>
          <span className="banner-weather__temp">{banner.weather?.tempF ?? 72}°F</span>
          <span className="banner-weather__cond">{banner.weather?.condition || 'Clear'}</span>
        </div>
      </div>
      <div className="banner-center" aria-label="Key momentum metrics">
        <div className="ticker" role="list">
          <AnimatePresence initial={false}>
            {tickerItems.map((item) => (
              <motion.span
                layout
                key={item.label}
                className="ticker-item"
                role="listitem"
                initial={{opacity: 0, y: 6}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -6}}
                transition={{duration: 0.2}}
              >
                <span className="ticker-label">{item.label}:</span>
                <strong>{item.value}</strong>
                <span className={item.direction === 'up' ? 'ticker-up' : 'ticker-down'} aria-hidden="true">
                  {item.direction === 'up' ? '▲' : '▼'} {Math.abs(item.delta)}%
                </span>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>
      <div className="banner-right" aria-label="Clock">
        <button className="ghost" onClick={() => setClockFormat((f) => (f === '24h' ? '12h' : '24h'))}>
          {clockFormat === '24h' ? '24h' : '12h'} · {formatTime(now, clockFormat)}
        </button>
      </div>
    </div>
  )
}

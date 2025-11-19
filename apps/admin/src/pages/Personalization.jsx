import React, {useEffect, useState} from 'react'

export default function Personalization() {
  const [rules, setRules] = useState([])
  const [simCtx, setSimCtx] = useState({
    preference: '',
    location: '',
    timeOfDay: '',
    lastPurchaseDaysAgo: '',
  })
  const [result, setResult] = useState(null)

  useEffect(() => {
    let mounted = true
    fetch('/api/admin/personalization/rules', {credentials: 'include'})
      .then((r) => r.json())
      .then((j) => mounted && setRules(j))
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  async function simulate() {
    const body = {
      context: {...simCtx, lastPurchaseDaysAgo: Number(simCtx.lastPurchaseDaysAgo || 0)},
      contentType: 'article',
    }
    const res = await fetch('/personalization/apply', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    })
    const j = await res.json()
    setResult(j)
  }

  return (
    <div style={{padding: 20}}>
      <h1>Personalization Rules</h1>
      <div style={{display: 'flex', gap: 20}}>
        <div style={{flex: 1}}>
          <h2>Rules</h2>
          <ul>
            {rules.map((r) => (
              <li key={r._id} style={{marginBottom: 8}}>
                <strong>{r.name}</strong> {r.enabled ? '' : '(disabled)'}
                <br />
                <small>{r.description}</small>
                <div>
                  Conditions:{' '}
                  {(r.conditions || []).map((c) => `${c.key} ${c.operator} ${c.value}`).join('; ')}
                </div>
                <div>
                  Actions:{' '}
                  {(r.actions || [])
                    .map(
                      (a) =>
                        `${a.targetType}:${a.targetSlugOrKey} (+${a.priorityBoost})${a.channel ? ' @' + a.channel : ''}`,
                    )
                    .join('; ')}
                </div>
                <div>
                  <a
                    href={
                      (process.env.SANITY_STUDIO_URL || '/studio').replace(/\/$/, '') +
                      '/desk/personalizationRule;' +
                      r._id
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Studio
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div style={{width: 360}}>
          <h2>Simulator</h2>
          <label>
            Preference
            <br />
            <input
              value={simCtx.preference}
              onChange={(e) => setSimCtx({...simCtx, preference: e.target.value})}
            />
          </label>
          <label>
            Location
            <br />
            <input
              value={simCtx.location}
              onChange={(e) => setSimCtx({...simCtx, location: e.target.value})}
            />
          </label>
          <label>
            Time of day
            <br />
            <input
              value={simCtx.timeOfDay}
              onChange={(e) => setSimCtx({...simCtx, timeOfDay: e.target.value})}
            />
          </label>
          <label>
            Last purchase days ago
            <br />
            <input
              value={simCtx.lastPurchaseDaysAgo}
              onChange={(e) => setSimCtx({...simCtx, lastPurchaseDaysAgo: e.target.value})}
            />
          </label>
          <div style={{marginTop: 8}}>
            <button onClick={simulate}>Simulate</button>
          </div>
          <div style={{marginTop: 16}}>
            <h3>Result</h3>
            <pre style={{whiteSpace: 'pre-wrap'}}>
              {result ? JSON.stringify(result, null, 2) : 'Run simulation'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

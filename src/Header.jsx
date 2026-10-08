import { useEffect, useState } from 'react'
import { formatClock } from './lib/copy'

function Header({ heroes, prefs, onToggle }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const budget = heroes.reduce((sum, h) => sum + h.costUsd, 0)
  const active = heroes.filter((h) => h.status !== 'idle').length

  return (
    <header className="header">
      <h1>AI DISPATCH</h1>
      <div className="shift">
        <span>SHIFT 1</span>
        <span className="mono">{formatClock(now)}</span>
        <span>Budget <strong className="mono">${budget.toFixed(2)}</strong></span>
        <span>Aktif <strong>{active}/{heroes.length}</strong></span>
      </div>
      <div className="prefs" role="group" aria-label="Preferensi">
        {[
          ['feed', 'Demo feed'],
          ['serious', 'Mode serius'],
          ['sfx', 'SFX'],
        ].map(([key, label]) => (
          <button key={key} type="button" aria-pressed={prefs[key]} className={prefs[key] ? 'is-active' : undefined} onClick={() => onToggle(key)}>
            {label}
          </button>
        ))}
      </div>
    </header>
  )
}

export default Header

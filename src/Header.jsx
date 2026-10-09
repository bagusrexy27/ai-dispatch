import { useEffect, useState } from 'react'
import { formatClock } from './lib/copy'

const CONNECTION_LABELS = {
  connecting: 'MENGHUBUNGKAN',
  live: 'LIVE',
  reconnecting: 'PUTUS · COBA LAGI',
  offline: 'OFFLINE',
}

function Header({ heroes, done, callCount, connection, prefs, onToggle, onCallsClick }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const budget = heroes.reduce((sum, h) => sum + h.costUsd, 0)
  const inField = heroes.filter((h) => h.loc !== 'hq').length

  return (
    <header className="header">
      <div className="brand display">AI Dispatch</div>
      <span className="shift">SHIFT 1</span>
      <div className="tag mono">divisi hero // lokal</div>
      <div className="spacer" />
      {connection !== 'demo' && <span className={`connection connection-${connection}`} role="status">{CONNECTION_LABELS[connection]}</span>}
      <div className="stat mono">{formatClock(now, false)}</div>
      <div className="stat opt">DI LAPANGAN <b className="mono">{inField}/{heroes.length}</b></div>
      <div className="stat opt">SELESAI <b className="mono">{done}</b></div>
      <div className="stat opt">BUDGET <b className="mono">${budget.toFixed(2)}</b></div>
      {callCount > 0 && <button type="button" className="calls" onClick={onCallsClick}>!! {callCount} PANGGILAN</button>}
      <button type="button" className="btn" aria-pressed={prefs.sfx} onClick={() => onToggle('sfx')}>SFX</button>
      <button type="button" className="btn" aria-pressed={prefs.music} onClick={() => onToggle('music')}>Musik</button>
      <button type="button" className="btn" aria-pressed={prefs.serious} onClick={() => onToggle('serious')}>Mode serius</button>
    </header>
  )
}

export default Header

import { useLayoutEffect, useRef } from 'react'
import { formatClock, logParts } from './lib/copy'
import { HeroFace } from './HeroFace'

const VISIBLE = 80
const STICK_PX = 30

export function Rich({ parts }) {
  return parts.map((p, i) => (typeof p === 'string' ? p : <code key={i}>{p.code}</code>))
}

function LogLine({ entry, serious }) {
  const parts = logParts(entry, serious)
  if (!parts) return null
  return (
    <li>
      <span className="t mono">{formatClock(entry.at)}</span>
      {entry.model && <HeroFace hero={entry} className="sm" />}
      <span className={parts.tone}>
        {parts.prefix}
        <span className="cs" style={parts.whoColor ? { color: parts.whoColor } : undefined}>{parts.who}</span>
        <Rich parts={parts.text} />
      </span>
    </li>
  )
}

function RadioLog({ log, serious }) {
  const listRef = useRef(null)
  const stick = useRef(true)

  useLayoutEffect(() => {
    if (stick.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [log])

  function onScroll() {
    const ul = listRef.current
    stick.current = ul.scrollHeight - ul.scrollTop - ul.clientHeight < STICK_PX
  }

  return (
    <section className="log box" aria-label="Radio log">
      <div className="panel-title"><span className="live" aria-hidden="true" />Radio log</div>
      <ul ref={listRef} className="log-list" aria-live="polite" onScroll={onScroll}>
        {log.length === 0 && <li className="muted">Frekuensi sepi. Terlalu sepi.</li>}
        {log.slice(-VISIBLE).map((e) => <LogLine key={e.id} entry={e} serious={serious} />)}
      </ul>
    </section>
  )
}

export default RadioLog

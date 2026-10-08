import { formatClock, logLine } from './lib/copy'

function RadioLog({ log, serious }) {
  return (
    <section className="radio-log panel" aria-label="Radio log">
      <h2>Radio Log</h2>
      {log.length === 0 && <p className="muted">Markas online. Menunggu hero...</p>}
      <ol aria-live="polite">
        {log.toReversed().map((e) => (
          <li key={e.id} className={`log-${e.type}`}>
            <span className="mono muted">{formatClock(e.at)}</span> {logLine(e, serious)}
          </li>
        ))}
      </ol>
    </section>
  )
}

export default RadioLog

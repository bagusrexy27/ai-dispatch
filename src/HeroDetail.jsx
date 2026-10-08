import { LOCATIONS, MODELS, STAT_LABELS, STATUS } from './lib/status'

function Radar({ stats }) {
  const size = 160
  const c = size / 2
  const r = 56
  const max = Math.max(...stats, 1)
  const point = (i, scale) => {
    const angle = (Math.PI * 2 * i) / stats.length - Math.PI / 2
    return [c + Math.cos(angle) * r * scale, c + Math.sin(angle) * r * scale]
  }
  const polygon = stats.map((v, i) => point(i, v / max).join(',')).join(' ')

  return (
    <svg className="radar" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Radar profil kerja">
      {[0.33, 0.66, 1].map((s) => (
        <polygon key={s} points={stats.map((_, i) => point(i, s).join(',')).join(' ')} className="radar-grid" />
      ))}
      <polygon points={polygon} className="radar-value" />
      {STAT_LABELS.map((label, i) => {
        const [x, y] = point(i, 1.32)
        return (
          <text key={label} x={x} y={y} textAnchor="middle" dominantBaseline="middle">
            {label} {stats[i]}
          </text>
        )
      })}
    </svg>
  )
}

function HeroDetail({ hero, onClose }) {
  const stamina = 1 - hero.tokensUsed / hero.tokensMax

  return (
    <aside className="detail panel" aria-label={`Detail ${hero.callsign}`}>
      <div className="detail-head">
        <h2>
          <span className="badge" style={{ '--badge': MODELS[hero.model]?.color }}>{hero.model}</span> {hero.callsign}
        </h2>
        <button type="button" onClick={onClose} aria-label="Tutup detail">Tutup <kbd>Esc</kbd></button>
      </div>
      <dl>
        <dt>Status</dt><dd className={`status status-${hero.status}`}>{STATUS[hero.status].label}</dd>
        <dt>Lokasi</dt><dd>{LOCATIONS[hero.loc].label}</dd>
        <dt>Tugas</dt><dd>{hero.task}</dd>
        <dt>Repo</dt><dd className="mono">{hero.project} @ {hero.branch}</dd>
        <dt>Model</dt><dd>{MODELS[hero.model]?.name} {hero.variant}</dd>
        <dt>Sesi</dt><dd className="mono">{hero.sessionId}</dd>
        <dt>Budget</dt><dd className="mono">${hero.costUsd.toFixed(3)}</dd>
        <dt>Stamina</dt>
        <dd>
          <span className="bar"><span style={{ width: `${stamina * 100}%` }} /></span>
          <span className="mono muted">{hero.tokensUsed.toLocaleString('id-ID')} / {hero.tokensMax.toLocaleString('id-ID')} token</span>
        </dd>
      </dl>
      <Radar stats={hero.stats} />
      <h3>Sidekick</h3>
      {hero.sidekicks.length ? (
        <ul className="files">
          {hero.sidekicks.map((s) => (
            <li key={s.id}>
              <span className="sidekick-count">{s.callsign}</span> <span className={`status status-${s.status}`}>{STATUS[s.status].label}</span> {s.task}
            </li>
          ))}
        </ul>
      ) : <p className="muted">Kerja sendirian.</p>}
      <h3>File terakhir</h3>
      {hero.files.length ? (
        <ul className="mono files">
          {hero.files.toReversed().map((f, i) => (
            <li key={i}><span className={`op op-${f.op}`}>{f.op}</span> {f.path}</li>
          ))}
        </ul>
      ) : <p className="muted">Belum ada file disentuh.</p>}
      <h3>Riwayat</h3>
      {hero.history.length ? (
        <ul className="mono files">
          {hero.history.toReversed().map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      ) : <p className="muted">Belum ada commit/error.</p>}
    </aside>
  )
}

export default HeroDetail

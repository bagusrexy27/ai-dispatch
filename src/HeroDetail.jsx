import { StatusLabel, Stamina } from './HeroCard'
import { LOC_NAMES, STAT_LABELS, STATUS, fmtTok } from './lib/status'

function Radar({ stats, color }) {
  const R = 60, c = [120, 82]
  const max = Math.max(...stats, 1)
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5
  const pt = (i, r) => [c[0] + Math.cos(ang(i)) * r, c[1] + Math.sin(ang(i)) * r]
  const poly = (fn) => STAT_LABELS.map((_, i) => fn(i).map((v) => v.toFixed(1)).join(',')).join(' ')
  const label = STAT_LABELS.map((a, i) => `${a} ${Math.round((stats[i] / max) * 100)}%`).join(', ')

  return (
    <svg className="radar" width="240" height="172" viewBox="0 0 240 172" role="img" aria-label={`Profil kerja: ${label}`}>
      {[0.33, 0.66, 1].map((f) => <polygon key={f} points={poly((i) => pt(i, R * f))} fill="none" stroke="var(--wire)" strokeOpacity=".5" />)}
      {STAT_LABELS.map((a, i) => {
        const [x, y] = pt(i, R), [lx, ly] = pt(i, R + 14)
        return (
          <g key={a}>
            <line x1={c[0]} y1={c[1]} x2={x} y2={y} stroke="var(--wire)" strokeOpacity=".4" />
            <text x={lx} y={ly + 3} textAnchor="middle">{a}</text>
          </g>
        )
      })}
      <polygon points={poly((i) => pt(i, R * Math.max(0.06, stats[i] / max)))} fill={color} fillOpacity=".35" stroke={color} strokeWidth="2" />
    </svg>
  )
}

function HeroDetail({ hero, traveling, onClose }) {
  const kid = hero.sidekicks[0]

  return (
    <aside className="detail box" aria-label={`Detail ${hero.callsign}`}>
      <div className="detail-head">
        <span className={`badge lg m-${hero.model}`} aria-label={`model ${hero.model}`}>{hero.model}</span>
        <div className="detail-title">
          <h3 className="display">{hero.callsign}</h3>
          <div className="mono detail-meta">{hero.sessionId} · {hero.model} {hero.variant}</div>
        </div>
        <button type="button" className="close" aria-label="Tutup" onClick={onClose}>×</button>
      </div>
      <div className="detail-body">
        <div className="section">Profil kerja · 1 jam terakhir</div>
        <Radar stats={hero.stats} color={STATUS[hero.status].color} />
        <dl>
          <dt>Status</dt><dd><StatusLabel hero={hero} traveling={traveling} /></dd>
          <dt>Lokasi</dt><dd>{LOC_NAMES[hero.loc]}</dd>
          <dt>Misi</dt><dd>{hero.task}</dd>
          <dt>Project</dt><dd className="mono">{hero.project}</dd>
          <dt>Branch</dt><dd className="mono">{hero.branch}</dd>
          <dt>Stamina</dt>
          <dd>
            <Stamina hero={hero} />
            <span className="mono muted small">{fmtTok(hero.tokensUsed)} / {fmtTok(hero.tokensMax)} tok</span>
          </dd>
          <dt>Biaya</dt><dd className="mono">${hero.costUsd.toFixed(2)}</dd>
          {kid && (
            <>
              <dt>Sidekick</dt>
              <dd><span className="display sidekick-name">{kid.callsign}</span> di {LOC_NAMES[kid.loc]} — {kid.task}</dd>
            </>
          )}
        </dl>
        <div className="section">File disentuh</div>
        <ul className="files mono">
          {hero.files.length
            ? hero.files.toReversed().map((f, i) => <li key={i}><span className={`k k-${f.op}`}>{f.op}</span>{f.path}</li>)
            : <li className="muted">—</li>}
        </ul>
        <div className="section">Riwayat misi</div>
        <ul className="files mono">
          {hero.history.length
            ? hero.history.toReversed().map((x, i) => <li key={i} className={x.startsWith('✓') ? 'ok' : 'fail'}>{x}</li>)
            : <li className="muted">—</li>}
        </ul>
      </div>
    </aside>
  )
}

export default HeroDetail

import { Icon } from './lib/icons'
import { LOC_NAMES, MODEL_BG, STATUS } from './lib/status'

export function StatusLabel({ hero, traveling }) {
  if (traveling) return <span className="status s-travel"><Icon name="hq" />Menuju {LOC_NAMES[hero.loc]}</span>
  return <span className={`status s-${hero.status}`}><Icon name={hero.status} />{STATUS[hero.status].label}</span>
}

export function Stamina({ hero }) {
  const pct = Math.round((hero.tokensUsed / hero.tokensMax) * 100)
  return (
    <div className={`stamina${pct > 85 ? ' hot' : ''}`} role="meter" aria-label={`stamina ${pct}%`} aria-valuenow={hero.tokensUsed} aria-valuemin={0} aria-valuemax={hero.tokensMax}>
      <i style={{ width: `${pct}%` }} />
    </div>
  )
}

function HeroCard({ hero, index, selected, traveling, onSelect }) {
  const classes = ['card', 'box', hero.status, selected && 'selected'].filter(Boolean).join(' ')
  const kid = hero.sidekicks[0]

  return (
    <button type="button" className={classes} onClick={() => onSelect(hero.id)} aria-label={`${hero.callsign}, ${STATUS[hero.status].label}`} aria-pressed={selected}>
      {hero.status === 'attention' && <span className="alert-badge">!!</span>}
      {kid && <span className="sidekick">+ {kid.callsign}</span>}
      <div className="portrait" style={{ background: MODEL_BG[hero.model] ?? '#999' }}>
        <span className="num">{index + 1}</span>
        <span className="lm">{hero.model}</span>
        <span className="stbar">
          <Icon name={traveling ? 'hq' : hero.status} style={{ stroke: traveling ? 'var(--text)' : STATUS[hero.status].color }} />
        </span>
      </div>
      <div className="info">
        <div><span className="cs">{hero.callsign}</span><span className="var">{hero.variant}</span></div>
        <StatusLabel hero={hero} traveling={traveling} />
        <div className="card-task" title={hero.task}>{hero.task}</div>
        <div className="card-proj mono">{hero.project}</div>
        <Stamina hero={hero} />
      </div>
    </button>
  )
}

export default HeroCard

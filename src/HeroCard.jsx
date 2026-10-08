import { LOCATIONS, MODELS, STATUS } from './lib/status'

function HeroCard({ hero, index, selected, onSelect }) {
  const isSelected = hero.id === selected
  const stamina = 1 - hero.tokensUsed / hero.tokensMax
  const classes = ['hero-card', isSelected && 'is-selected', hero.status === 'attention' && 'is-attention'].filter(Boolean).join(' ')

  return (
    <button type="button" className={classes} onClick={() => onSelect(hero.id)} aria-pressed={isSelected}>
      <span className="hero-card-top">
        <kbd>{index + 1}</kbd>
        <span className="badge" style={{ '--badge': MODELS[hero.model]?.color }}>{hero.model}</span>
        <strong>{hero.callsign}</strong>
        <span className="muted">{hero.variant}</span>
      </span>
      <span className={`status status-${hero.status}`}>{STATUS[hero.status].label}</span>
      <span className="muted">{LOCATIONS[hero.loc].label} · {hero.project}</span>
      <span className="task">{hero.task}</span>
      {hero.sidekicks.length > 0 && <span className="sidekick-count">+{hero.sidekicks.length} sidekick</span>}
      <span className="bar" aria-label={`Stamina ${Math.round(stamina * 100)}%`}>
        <span style={{ width: `${stamina * 100}%` }} />
      </span>
    </button>
  )
}

export default HeroCard

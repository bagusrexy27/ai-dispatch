import { useEffect, useState } from 'react'
import { LOCATIONS, MODELS } from './lib/status'

const TRAVEL_MS = 700
const SLOT_OFFSETS = [[-26, 34], [26, 34], [-70, 30], [70, 30], [-70, -30], [70, -30]]
const STAMPS = { commit: 'BERES!', error: 'WADUH!', call_result: 'DIJAWAB' }
const RECENT_STAMPS = 6

function slotPosition(loc, slot) {
  const [dx, dy] = SLOT_OFFSETS[slot % SLOT_OFFSETS.length]
  return { x: LOCATIONS[loc].x + dx, y: LOCATIONS[loc].y + dy }
}

function MapHero({ hero, pos, selected, onSelect }) {
  const [shown, setShown] = useState(hero.loc)

  useEffect(() => {
    if (shown === hero.loc) return
    const next = shown === 'hq' || hero.loc === 'hq' ? hero.loc : 'hq'
    const id = setTimeout(() => setShown(next), shown === 'hq' ? TRAVEL_MS : 30)
    return () => clearTimeout(id)
  }, [shown, hero.loc])

  const { x, y } = shown === hero.loc ? pos : LOCATIONS[shown]
  const classes = ['map-hero', hero.id === selected && 'is-selected', hero.status === 'attention' && 'is-attention'].filter(Boolean).join(' ')

  return (
    <g className={classes} style={{ transform: `translate(${x}px, ${y}px)` }} onClick={() => onSelect(hero.id)}>
      <title>{hero.callsign}</title>
      {hero.status === 'attention' && <circle r="17" className="attention-ring" />}
      <circle r="11" fill={MODELS[hero.model]?.color ?? '#999'} />
      <text y="4" textAnchor="middle" className="map-hero-initial">{hero.callsign[0]}</text>
      <text y="25" textAnchor="middle" className="map-hero-label">{hero.callsign}</text>
    </g>
  )
}

function MapView({ heroes, log, selected, onSelect }) {
  const slots = {}
  const place = (loc) => slotPosition(loc, (slots[loc] = (slots[loc] ?? -1) + 1))
  const heroPos = Object.fromEntries(heroes.map((h) => [h.id, place(h.loc)]))
  const sidekicks = heroes.flatMap((h) => h.sidekicks.map((s) => ({ ...s, parentId: h.id, pos: place(s.loc) })))
  const counts = heroes.reduce((acc, h) => ({ ...acc, [h.loc]: (acc[h.loc] ?? 0) + 1 }), {})
  const stamps = log.filter((e) => STAMPS[e.type]).slice(-RECENT_STAMPS)
  const { hq, dock } = LOCATIONS

  return (
    <section className="map panel" aria-label="Peta kota">
      <svg viewBox="0 0 800 450" role="img" aria-label="Peta lokasi hero">
        <defs>
          <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M25 0H0V25" className="map-grid" />
          </pattern>
        </defs>
        <rect width="800" height="450" fill="url(#grid)" />
        {Object.entries(LOCATIONS).filter(([id]) => id !== 'hq').map(([id, loc]) => (
          <line key={id} x1={hq.x} y1={hq.y} x2={loc.x} y2={loc.y} className="road" />
        ))}
        {Object.entries(LOCATIONS).map(([id, loc]) => (
          <g key={id} className={`building building-${id}`} transform={`translate(${loc.x} ${loc.y})`}>
            <rect x="-56" y="-20" width="112" height="40" rx="4" />
            <text y="-2" textAnchor="middle">{loc.label}</text>
            <text y="13" textAnchor="middle" className="building-count">{id === 'dock' ? 'paket commit' : `${counts[id] ?? 0} hero`}</text>
          </g>
        ))}

        {sidekicks.map((s) => (
          <g key={s.id} className="sidekick">
            <line x1={heroPos[s.parentId].x} y1={heroPos[s.parentId].y} x2={s.pos.x} y2={s.pos.y} className="tether" />
            <g transform={`translate(${s.pos.x} ${s.pos.y})`}>
              <title>{`${s.callsign}: ${s.task}`}</title>
              <circle r="6" />
              <text y="17" textAnchor="middle">{s.callsign}</text>
            </g>
          </g>
        ))}

        {heroes.map((h) => (
          <MapHero key={h.id} hero={h} pos={heroPos[h.id]} selected={selected} onSelect={onSelect} />
        ))}

        {stamps.filter((e) => e.type === 'commit').map((e) => (
          <rect
            key={`packet-${e.id}`}
            className="packet"
            x="-6"
            y="-5"
            width="12"
            height="10"
            style={{ '--fx': `${LOCATIONS[e.loc].x}px`, '--fy': `${LOCATIONS[e.loc].y}px`, '--hx': `${hq.x}px`, '--hy': `${hq.y}px`, '--dx': `${dock.x}px`, '--dy': `${dock.y}px` }}
          />
        ))}
        {stamps.map((e) => (
          <g key={`stamp-${e.id}`} transform={`translate(${LOCATIONS[e.loc].x} ${LOCATIONS[e.loc].y - 34})`}>
            <text textAnchor="middle" className={`stamp stamp-${e.type}`}>{STAMPS[e.type]}</text>
          </g>
        ))}
      </svg>
    </section>
  )
}

export default MapView

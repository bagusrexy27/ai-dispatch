import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import Header from './Header'
import HeroCard from './HeroCard'
import HeroDetail from './HeroDetail'
import FilterBar from './FilterBar'
import RadioLog from './RadioLog'
import IncomingCall from './IncomingCall'
import MapView from './MapView'
import { applyEvent, initialWorld } from './world'
import { startDemoFeed } from './demoFeed'
import { ring } from './lib/sfx'
import { STATUS } from './lib/status'
import './App.css'

const MAX_VISIBLE_CALLS = 3
const PREFS_KEY = 'ai-dispatch:prefs'

const filters = [
  { id: 'ALL', label: 'Semua Hero' },
  ...Object.entries(STATUS).map(([id, s]) => ({ id, label: s.label })),
]

function loadPrefs() {
  try {
    return { feed: true, serious: false, sfx: false, ...JSON.parse(localStorage.getItem(PREFS_KEY)) }
  } catch {
    return { feed: true, serious: false, sfx: false }
  }
}

function App() {
  const [world, dispatchWorld] = useReducer(applyEvent, initialWorld)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [query, setQuery] = useState('')
  const [prefs, setPrefs] = useState(loadPrefs)
  const callPanelRef = useRef(null)
  const sfxRef = useRef(prefs.sfx)

  useEffect(() => {
    sfxRef.current = prefs.sfx
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  }, [prefs])

  const dispatch = useCallback((ev) => {
    if (ev.type === 'call_open' && sfxRef.current) ring()
    dispatchWorld({ at: Date.now(), ...ev })
  }, [])

  useEffect(() => {
    if (!prefs.feed) return
    return startDemoFeed(initialWorld.heroes, dispatch)
  }, [prefs.feed, dispatch])

  const { heroes, calls, log } = world
  const visibleHeroes = heroes.filter((h) => {
    const matchQuery = h.callsign.toLowerCase().includes(query.toLowerCase())
    const matchFilter = filter === 'ALL' || h.status === filter
    return matchFilter && matchQuery
  })
  const selectedHero = heroes.find((h) => h.id === selected)

  function handleAnswer(call, decision, extra) {
    dispatch({ type: 'call_result', heroId: call.heroId, callId: call.callId, decision, ...extra })
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.target.closest('input, textarea, select')) return
      if (e.key === 'Escape') setSelected(null)
      else if (e.code === 'Space' && callPanelRef.current) {
        e.preventDefault()
        callPanelRef.current.focus()
      } else if (/^[1-9]$/.test(e.key)) {
        const hero = visibleHeroes[Number(e.key) - 1]
        if (hero) setSelected(hero.id)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [visibleHeroes])

  return (
    <div className="app">
      <Header heroes={heroes} prefs={prefs} onToggle={(key) => setPrefs((p) => ({ ...p, [key]: !p[key] }))} />

      <div className="stage">
        <MapView heroes={heroes} log={log} selected={selected} onSelect={setSelected} />

        <div className="side">
          <section className="calls" aria-label="Panggilan masuk">
            {calls.length === 0 ? (
              <p className="muted panel calls-empty">Tidak ada panggilan. Markas tenang.</p>
            ) : (
              <>
                <p className="calls-hint muted"><kbd>Space</kbd> fokus panggilan · <kbd>Y</kbd>/<kbd>N</kbd>/<kbd>R</kbd> · <kbd>1</kbd>-<kbd>9</kbd></p>
                {calls.slice(0, MAX_VISIBLE_CALLS).map((call, i) => (
                  <IncomingCall
                    key={call.callId}
                    call={call}
                    hero={heroes.find((h) => h.id === call.heroId)}
                    serious={prefs.serious}
                    onAnswer={handleAnswer}
                    panelRef={i === 0 ? callPanelRef : undefined}
                  />
                ))}
                {calls.length > MAX_VISIBLE_CALLS && <p className="muted">+{calls.length - MAX_VISIBLE_CALLS} panggilan antre</p>}
              </>
            )}
          </section>
          <RadioLog log={log} serious={prefs.serious} />
        </div>
      </div>

      <section className="roster-wrap" aria-label="Roster hero">
        <div className="roster-tools">
          <FilterBar filter={filter} setFilter={setFilter} filters={filters} />
          <input type="search" placeholder="Cari hero" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Cari hero" />
        </div>
        <div className="roster">
          {visibleHeroes.map((hero, i) => (
            <HeroCard key={hero.id} hero={hero} index={i} selected={selected} onSelect={setSelected} />
          ))}
          {visibleHeroes.length === 0 && <p className="muted">Tidak ada hero yang cocok dengan pencarian.</p>}
        </div>
      </section>

      {selectedHero && <HeroDetail hero={selectedHero} onClose={() => setSelected(null)} />}
    </div>
  )
}

export default App

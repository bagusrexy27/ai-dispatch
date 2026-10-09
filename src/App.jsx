import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import Header from './Header'
import HeroCard from './HeroCard'
import HeroDetail from './HeroDetail'
import RadioLog from './RadioLog'
import IncomingCall from './IncomingCall'
import MapView from './MapView'
import { applyEvent, createWorld } from './world'
import { startDemoFeed } from './demoFeed'
import { startSseFeed, sendDecision } from './ingest/sseFeed'
import demoHeroes from './heroes'
import { setMusic, setSfx, sfx } from './lib/sfx'
import { STATUS } from './lib/status'
import './App.css'

const PREFS_KEY = 'ai-dispatch:prefs'
const FEED_MODE = import.meta.env.VITE_FEED_MODE === 'sse' || import.meta.env.MODE === 'live' ? 'sse' : 'demo'
const API_BASE = import.meta.env.VITE_API_BASE ?? ''
const DEMO_HEROES = createWorld(demoHeroes).heroes
const DEMO_SEND_MS = 800
const CLOSING_MS = 2000
const EVENT_SFX = { call_open: 'ring', commit: 'thunk', error: 'buzz' }
const QUIET = new Set(['token_usage', 'cost', 'call_state', 'hero_upsert'])

function loadPrefs() {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')
    // migrate legacy key from early builds
    if (localStorage.getItem('ai-dispatch:serious') === '1') raw.serious = true
    return { serious: false, sfx: false, music: false, ...raw }
  } catch {
    return { serious: false, sfx: false, music: false }
  }
}

const SENT = {
  approve: () => 'disetujui',
  deny: () => 'ditolak',
  option: (x) => `opsi ${x.optionId} — ${x.optionLabel}`,
  other: (x) => `jawaban custom — "${x.message}"`,
  answer: (x) => `jawaban — "${x.message}"`,
  reply: (x) => `dibalas — "${x.message}"`,
}
const sentLine = (decision, extra) => `Terkirim: ${SENT[decision](extra)}`

function App() {
  const [world, dispatchWorld] = useReducer(applyEvent, FEED_MODE === 'demo' ? demoHeroes : [], createWorld)
  const [connection, setConnection] = useState(FEED_MODE === 'demo' ? 'demo' : 'connecting')
  const [selected, setSelected] = useState(null)
  const [traveling, setTraveling] = useState(() => new Set())
  const [closing, setClosing] = useState(null)
  const [prefs, setPrefs] = useState(loadPrefs)
  const worldRef = useRef(world)
  const callPanelRef = useRef(null)

  useEffect(() => {
    worldRef.current = world
  })

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ serious: prefs.serious, sfx: prefs.sfx, music: prefs.music }))
    localStorage.removeItem('ai-dispatch:serious')
    setSfx(prefs.sfx)
    setMusic(prefs.music)
  }, [prefs])

  useEffect(() => () => setMusic(false), [])

  const dispatch = useCallback((ev) => {
    if (ev.type === 'hydrate') {
      dispatchWorld(ev)
      return
    }
    sfx(EVENT_SFX[ev.type] ?? (QUIET.has(ev.type) ? null : 'krrk'))
    dispatchWorld({ at: Date.now(), ...ev })
  }, [])

  useEffect(() => {
    if (FEED_MODE === 'sse') return startSseFeed(API_BASE, dispatch, setConnection)
    return startDemoFeed(DEMO_HEROES, dispatch, () => worldRef.current)
  }, [dispatch])

  const onTravelChange = useCallback((id, moving) => {
    if (moving) sfx('whoosh')
    setTraveling((prev) => {
      if (prev.has(id) === moving) return prev
      const next = new Set(prev)
      if (moving) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const { heroes, calls, log } = world
  const roster = heroes.toSorted((a, b) => STATUS[a.status].order - STATUS[b.status].order)
  const selectedHero = heroes.find((h) => h.id === selected)
  const activeCall = closing?.call ?? calls[0]
  const callHero = closing?.hero ?? heroes.find((h) => h.id === activeCall?.heroId)

  function close(call, hero, line) {
    setClosing({ call, hero, line })
    setTimeout(() => setClosing(null), CLOSING_MS)
  }

  async function handleAnswer(call, decision, extra) {
    const { callId } = call
    const hero = heroes.find((h) => h.id === call.heroId)
    sfx('click')
    dispatch({ type: 'call_state', callId, state: 'sending' })

    if (FEED_MODE === 'demo') {
      setTimeout(() => {
        close({ ...call, state: 'answered' }, hero, sentLine(decision, extra))
        dispatch({ type: 'call_result', callId, decision, ...extra })
      }, DEMO_SEND_MS)
      return
    }
    try {
      await sendDecision(API_BASE, callId, { decision, optionId: extra.optionId ?? null, message: extra.message ?? null })
      close({ ...call, state: 'answered' }, hero, sentLine(decision, extra))
    } catch (err) {
      dispatch({ type: 'notice', level: 'warn', text: err.message })
      dispatch(err.status === 409 ? { type: 'call_closed', callId, reason: 'stale' } : { type: 'call_state', callId, state: 'failed' })
    }
  }

  function focusCall() {
    if (!callPanelRef.current) return
    callPanelRef.current.focus()
    if (activeCall) setSelected(activeCall.heroId)
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.target.closest('input, textarea, select')) return
      if (e.key === 'Escape') setSelected(null)
      else if (e.code === 'Space') {
        e.preventDefault()
        focusCall()
      } else if (/^[1-9]$/.test(e.key)) {
        const hero = roster[Number(e.key) - 1]
        if (hero) setSelected(hero.id)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <div className="app">
      <Header
        heroes={heroes}
        done={world.done}
        callCount={calls.length}
        connection={connection}
        prefs={prefs}
        onToggle={(key) => setPrefs((p) => {
          const next = { ...p, [key]: !p[key] }
          if (key === 'sfx') setSfx(next.sfx)
          if (key === 'music') setMusic(next.music)
          return next
        })}
        onCallsClick={focusCall}
      />

      <div className="side">
        {activeCall && callHero && (
          <IncomingCall
            key={activeCall.callId}
            call={activeCall}
            hero={callHero}
            serious={prefs.serious}
            closing={closing}
            queued={Math.max(0, calls.length - (closing ? 0 : 1))}
            onAnswer={handleAnswer}
            panelRef={callPanelRef}
          />
        )}
        <RadioLog log={log} serious={prefs.serious} />
      </div>

      <MapView heroes={heroes} log={log} selected={selected} traveling={traveling} onSelect={setSelected} onTravelChange={onTravelChange}>
        {selectedHero && <HeroDetail key={selectedHero.id} hero={selectedHero} traveling={traveling.has(selectedHero.id)} onClose={() => setSelected(null)} />}
      </MapView>

      <nav className="roster" aria-label="Roster hero">
        {roster.length === 0 && <p className="muted roster-empty">Belum ada hero terhubung ke markas.</p>}
        {roster.map((hero, i) => (
          <HeroCard key={hero.id} hero={hero} index={i} selected={selected === hero.id} traveling={traveling.has(hero.id)} onSelect={setSelected} />
        ))}
      </nav>
    </div>
  )
}

export default App

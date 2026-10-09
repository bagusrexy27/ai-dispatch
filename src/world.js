import { STATUS } from './lib/status.js'
import { callsignFor } from './lib/callsign.js'

const LOG_CAP = 200
const FILES_CAP = 5
const HISTORY_CAP = 8
const PASSIVE = new Set(['token_usage', 'cost', 'call_state', 'hero_upsert'])

export function normalizeHero(h) {
  return {
    callsign: callsignFor(h.sessionId ?? h.id),
    sessionId: h.id,
    model: '??',
    variant: '',
    status: 'idle',
    project: '-',
    branch: '-',
    task: '-',
    tokensUsed: 0,
    tokensMax: 1,
    costUsd: 0,
    stats: [0, 0, 0, 0, 0],
    files: [],
    history: [],
    sidekicks: [],
    radioTo: null,
    ...h,
    loc: STATUS[h.status]?.loc ?? h.loc ?? 'hq',
  }
}

export function createWorld(heroes = []) {
  return { heroes: heroes.map(normalizeHero), calls: [], log: [], seq: 0, done: 0 }
}

function moveTo(h, status) {
  if (h.status === 'attention' || !STATUS[status]) return {}
  return { status, loc: STATUS[status].loc ?? h.loc, radioTo: null }
}

function bump(h, i) {
  const stats = [...h.stats]
  stats[i] += 1
  return stats
}

function pushCapped(list, item, cap) {
  return [...list, item].slice(-cap)
}

function heroPatch(h, ev) {
  switch (ev.type) {
    case 'hero_upsert':
      return normalizeHero({ ...h, ...ev.hero })
    case 'status':
      if (h.status === ev.status && h.radioTo === (ev.radioTo ?? null)) return null
      return { ...moveTo(h, ev.status), radioTo: ev.status === 'talking' ? ev.radioTo ?? null : null }
    case 'read':
      return { ...moveTo(h, 'reading'), stats: bump(h, 1), files: pushCapped(h.files, { op: 'read', path: ev.file }, FILES_CAP) }
    case 'edit':
      return { ...moveTo(h, 'coding'), stats: bump(h, 0), files: pushCapped(h.files, { op: 'edit', path: ev.file }, FILES_CAP) }
    case 'commit':
      return { stats: bump(h, 4), history: pushCapped(h.history, `✓ ${ev.sha} ${ev.message}`, HISTORY_CAP) }
    case 'error':
      return { history: pushCapped(h.history, `✗ ${ev.error}`, HISTORY_CAP) }
    case 'delegate':
      return { stats: bump(h, 2), sidekicks: [...h.sidekicks, { ...ev.sidekick, task: ev.task }] }
    case 'sidekick_end':
      return h.sidekicks.some((s) => s.id === ev.sidekickId) ? { sidekicks: h.sidekicks.filter((s) => s.id !== ev.sidekickId) } : null
    case 'token_usage':
      return { tokensUsed: ev.used, tokensMax: ev.max ?? h.tokensMax }
    case 'cost':
      return { costUsd: ev.costUsd }
    case 'call_open':
      return { status: 'attention', stats: bump(h, 3) }
    case 'call_result': {
      const next = ev.decision === 'deny' ? 'waiting' : 'coding'
      return { status: next, loc: STATUS[next].loc, stats: bump(h, 2) }
    }
    case 'call_closed':
      return { status: 'waiting', loc: STATUS.waiting.loc }
    case 'call_state':
      return {}
    default:
      return null
  }
}

function appendLog(state, entry) {
  const seq = state.seq + 1
  return { seq, log: pushCapped(state.log, { ...entry, id: seq }, LOG_CAP) }
}

export function applyEvent(state, ev) {
  if (ev.type === 'hydrate') return ev.world
  if (ev.type === 'notice') return { ...state, ...appendLog(state, { ...ev, callsign: 'MARKAS', loc: 'hq' }) }

  const heroId = ev.heroId ?? state.calls.find((c) => c.callId === ev.callId)?.heroId
  const hero = state.heroes.find((h) => h.id === heroId)

  if (ev.type === 'hero_upsert' && !hero) return { ...state, heroes: [...state.heroes, normalizeHero(ev.hero)] }
  if (!hero) return state
  if (ev.type === 'session_end') {
    return {
      ...state,
      heroes: state.heroes.filter((h) => h.id !== hero.id),
      calls: state.calls.filter((c) => c.heroId !== hero.id),
      ...appendLog(state, { ...ev, heroId: hero.id, callsign: hero.callsign, model: hero.model, variant: hero.variant, loc: hero.loc }),
    }
  }

  const callEvent = ['call_result', 'call_closed', 'call_state'].includes(ev.type)
  if (callEvent && !state.calls.some((c) => c.callId === ev.callId)) return state
  if (ev.type === 'call_open' && state.calls.some((c) => c.callId === ev.call.callId)) return state
  if (hero.status === 'attention' && !callEvent && ev.type !== 'call_open' && !PASSIVE.has(ev.type)) return state

  const patch = heroPatch(hero, ev)
  if (!patch) return state

  const next = {
    ...state,
    heroes: state.heroes.map((h) => (h.id === hero.id ? { ...h, ...patch } : h)),
  }
  if (!PASSIVE.has(ev.type)) Object.assign(next, appendLog(state, { ...ev, heroId: hero.id, callsign: hero.callsign, model: hero.model, variant: hero.variant, loc: hero.loc }))
  if (ev.type === 'commit') next.done = state.done + 1
  if (ev.type === 'call_open') next.calls = [...state.calls, { ...ev.call, heroId: hero.id, state: 'ringing' }]
  if (ev.type === 'call_result' || ev.type === 'call_closed') next.calls = state.calls.filter((c) => c.callId !== ev.callId)
  if (ev.type === 'call_state') next.calls = state.calls.map((c) => (c.callId === ev.callId ? { ...c, state: ev.state } : c))
  return next
}

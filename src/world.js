import heroes from './heroes'
import { STATUS } from './lib/status'

const LOG_CAP = 200
const FILES_CAP = 5
const HISTORY_CAP = 8
const PASSIVE = new Set(['token_usage', 'cost'])

export const initialWorld = {
  heroes: heroes.map((h) => ({ ...h, loc: STATUS[h.status].loc, sidekicks: [] })),
  calls: [],
  log: [],
  seq: 0,
}

function moveTo(h, status) {
  if (h.status === 'attention') return {}
  return { status, loc: STATUS[status].loc ?? h.loc }
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
    case 'status':
      return moveTo(h, ev.status)
    case 'read':
      return { ...moveTo(h, 'reading'), stats: bump(h, 1), files: pushCapped(h.files, { op: 'read', path: ev.file }, FILES_CAP) }
    case 'edit':
      return { ...moveTo(h, 'coding'), stats: bump(h, 0), files: pushCapped(h.files, { op: 'edit', path: ev.file }, FILES_CAP) }
    case 'commit':
      return { stats: bump(h, 4), history: pushCapped(h.history, `commit ${ev.sha} ${ev.message}`, HISTORY_CAP) }
    case 'error':
      return { history: pushCapped(h.history, `error ${ev.error}`, HISTORY_CAP) }
    case 'delegate':
      return { stats: bump(h, 2), sidekicks: [...h.sidekicks, { ...ev.sidekick, task: ev.task }] }
    case 'sidekick_end':
      return h.sidekicks.some((s) => s.id === ev.sidekickId) ? { sidekicks: h.sidekicks.filter((s) => s.id !== ev.sidekickId) } : null
    case 'token_usage':
      return { tokensUsed: Math.min(ev.used, h.tokensMax) }
    case 'cost':
      return { costUsd: h.costUsd + ev.usd }
    case 'call_open':
      return { status: 'attention', stats: bump(h, 3) }
    case 'call_result': {
      const next = ev.decision === 'deny' ? 'waiting' : 'coding'
      return { status: next, loc: STATUS[next].loc, stats: bump(h, 2) }
    }
    default:
      return null
  }
}

export function applyEvent(state, ev) {
  const hero = state.heroes.find((h) => h.id === ev.heroId)
  if (!hero) return state
  if (hero.status === 'attention' && ev.type !== 'call_result' && !PASSIVE.has(ev.type)) return state

  const patch = heroPatch(hero, ev)
  if (!patch) return state

  const next = {
    ...state,
    heroes: state.heroes.map((h) => (h.id === hero.id ? { ...h, ...patch } : h)),
  }
  if (!PASSIVE.has(ev.type)) {
    next.seq = state.seq + 1
    next.log = pushCapped(state.log, { ...ev, id: next.seq, callsign: hero.callsign, loc: hero.loc }, LOG_CAP)
  }
  if (ev.type === 'call_open') next.calls = [...state.calls, { ...ev.call, heroId: hero.id }]
  if (ev.type === 'call_result') next.calls = state.calls.filter((c) => c.callId !== ev.callId)
  return next
}

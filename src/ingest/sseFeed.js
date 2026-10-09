import { applyEvent, createWorld } from '../world.js'
import { translate } from './translate.js'

export class DecisionError extends Error {
  constructor(status) {
    super(status === 409 ? 'Panggilan sudah tertutup' : `Gagal mengirim keputusan (${status})`)
    this.status = status
  }
}

/** Rebuild world from snapshot so radio log survives reload (within server buffer). */
export function worldFromSnapshot(snap) {
  let state = createWorld()
  for (const env of snap.recent ?? []) {
    const ev = translate(env)
    if (ev) state = applyEvent(state, ev)
  }
  for (const call of snap.openCalls ?? []) {
    if (state.calls.some((c) => c.callId === call.callId)) continue
    const ev = translate({ type: 'call_open', payload: { call }, ts: call.startedAt })
    if (ev) state = applyEvent(state, ev)
  }
  for (const hero of snap.heroes ?? []) {
    state = applyEvent(state, { type: 'hero_upsert', heroId: hero.id, hero })
  }
  return state
}

export function startSseFeed(base, dispatch, onConnection) {
  let source = null
  let closed = false

  async function connect() {
    onConnection('connecting')
    let since = 0
    try {
      const res = await fetch(`${base}/v1/snapshot`)
      if (!res.ok) throw new Error(`snapshot ${res.status}`)
      const snap = await res.json()
      since = snap.lastEventId ?? 0
      dispatch({ type: 'hydrate', world: worldFromSnapshot(snap) })
    } catch (err) {
      dispatch({ type: 'notice', level: 'warn', text: `Snapshot gagal: ${err.message}` })
    }
    if (closed) return

    source = new EventSource(`${base}/v1/stream?since=${since}`)
    source.onopen = () => onConnection('live')
    source.onerror = () => onConnection(source.readyState === EventSource.CLOSED ? 'offline' : 'reconnecting')
    source.onmessage = (msg) => {
      try {
        const ev = translate(JSON.parse(msg.data))
        if (ev) dispatch(ev)
      } catch {
        dispatch({ type: 'notice', level: 'warn', text: 'Event rusak diabaikan' })
      }
    }
  }

  connect()
  return () => {
    closed = true
    source?.close()
  }
}

export async function sendDecision(base, callId, body) {
  const token = import.meta.env.VITE_DISPATCH_TOKEN
  const res = await fetch(`${base}/v1/calls/${encodeURIComponent(callId)}/decision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new DecisionError(res.status)
}

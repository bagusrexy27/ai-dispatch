import test from 'node:test'
import assert from 'node:assert/strict'
import { worldFromSnapshot } from '../src/ingest/sseFeed.js'

const ts = '2026-09-29T07:00:00.000Z'
const env = (id, type, payload) => ({ v: 1, id: String(id), ts, type, payload })

test('worldFromSnapshot rebuilds radio log and keeps authoritative hero state', () => {
  const snap = {
    lastEventId: 4,
    heroes: [{ id: 'h1', sessionId: 'h1', status: 'coding', project: 'repo', task: 'live' }],
    openCalls: [],
    recent: [
      env(1, 'hero_upsert', { hero: { id: 'h1', sessionId: 'h1', status: 'idle', project: 'repo', task: 'start' } }),
      env(2, 'read', { heroId: 'h1', path: 'a.go', op: 'read' }),
      env(3, 'edit', { heroId: 'h1', path: 'a.go', op: 'edit' }),
      env(4, 'status', { heroId: 'h1', status: 'waiting' }),
    ],
  }
  const world = worldFromSnapshot(snap)
  assert.equal(world.heroes[0].status, 'coding')
  assert.equal(world.heroes[0].task, 'live')
  assert.ok(world.log.some((e) => e.type === 'read'))
  assert.ok(world.log.some((e) => e.type === 'edit'))
})

test('worldFromSnapshot restores ringing calls missing from recent', () => {
  const call = { callId: 'c9', heroId: 'h1', kind: 'ask', quote: 'q', quoteSerious: 'q', techLine: 't' }
  const world = worldFromSnapshot({
    heroes: [{ id: 'h1', status: 'attention' }],
    openCalls: [call],
    recent: [env(1, 'hero_upsert', { hero: { id: 'h1', status: 'idle' } })],
  })
  assert.equal(world.calls[0].callId, 'c9')
  assert.equal(world.heroes[0].status, 'attention')
})

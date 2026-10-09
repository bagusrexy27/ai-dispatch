import test from 'node:test'
import assert from 'node:assert/strict'
import { applyEvent, createWorld } from '../src/world.js'

const hero = { id: 'h1', sessionId: 'sess_1', callsign: 'Rex', status: 'idle' }
const call = { callId: 'c1', heroId: 'h1', kind: 'permission', quote: 'q', quoteSerious: 'q', techLine: 't', startedAt: 0 }
const run = (state, ...events) => events.reduce(applyEvent, state)

test('hero_upsert adds an unknown hero and merges a known one', () => {
  let world = run(createWorld(), { type: 'hero_upsert', heroId: 'h1', hero })
  assert.equal(world.heroes.length, 1)
  assert.equal(world.heroes[0].loc, 'hq')

  world = run(world, { type: 'hero_upsert', heroId: 'h1', hero: { id: 'h1', status: 'coding', task: 'x' } })
  assert.equal(world.heroes.length, 1)
  assert.equal(world.heroes[0].loc, 'coding')
  assert.equal(world.heroes[0].callsign, 'Rex')
})

test('callsign is derived from sessionId when missing', () => {
  const a = run(createWorld(), { type: 'hero_upsert', heroId: 'x', hero: { id: 'x', sessionId: 'sess_abc' } })
  const b = run(createWorld(), { type: 'hero_upsert', heroId: 'y', hero: { id: 'y', sessionId: 'sess_abc' } })
  assert.equal(a.heroes[0].callsign, b.heroes[0].callsign)
})

test('events for unknown heroes are ignored', () => {
  const world = createWorld([hero])
  assert.equal(applyEvent(world, { type: 'read', heroId: 'nope', file: 'a' }), world)
})

test('call_open freezes the hero until the call is answered', () => {
  let world = run(createWorld([hero]), { type: 'read', heroId: 'h1', file: 'a.go' }, { type: 'call_open', heroId: 'h1', call })
  assert.equal(world.heroes[0].status, 'attention')
  assert.equal(world.heroes[0].loc, 'investigate')

  const frozen = run(world, { type: 'edit', heroId: 'h1', file: 'b.go' }, { type: 'status', heroId: 'h1', status: 'idle' })
  assert.equal(frozen, world)

  world = run(world, { type: 'call_result', callId: 'c1', decision: 'approve' })
  assert.equal(world.calls.length, 0)
  assert.equal(world.heroes[0].status, 'coding')
})

test('deny sends the hero to standby; call_closed without answer does too', () => {
  const open = run(createWorld([hero]), { type: 'call_open', heroId: 'h1', call })
  assert.equal(run(open, { type: 'call_result', callId: 'c1', decision: 'deny' }).heroes[0].status, 'waiting')
  const stale = run(open, { type: 'call_closed', callId: 'c1', reason: 'stale' })
  assert.equal(stale.heroes[0].status, 'waiting')
  assert.equal(stale.calls.length, 0)
})

test('duplicate call_open and results for unknown calls are ignored', () => {
  const open = run(createWorld([hero]), { type: 'call_open', heroId: 'h1', call })
  assert.equal(applyEvent(open, { type: 'call_open', heroId: 'h1', call }), open)
  assert.equal(applyEvent(open, { type: 'call_result', callId: 'zzz', decision: 'approve' }), open)
})

test('call_state updates the call without logging', () => {
  const open = run(createWorld([hero]), { type: 'call_open', heroId: 'h1', call })
  const sending = applyEvent(open, { type: 'call_state', callId: 'c1', state: 'sending' })
  assert.equal(sending.calls[0].state, 'sending')
  assert.equal(sending.log.length, open.log.length)
})

test('session_end removes the hero and its calls', () => {
  const world = run(createWorld([hero]), { type: 'call_open', heroId: 'h1', call }, { type: 'session_end', heroId: 'h1' })
  assert.equal(world.heroes.length, 0)
  assert.equal(world.calls.length, 0)
})

test('log ids stay unique and log is capped', () => {
  let world = createWorld([hero])
  for (let i = 0; i < 250; i++) world = applyEvent(world, { type: 'commit', heroId: 'h1', sha: String(i), message: 'm' })
  assert.equal(world.log.length, 200)
  assert.equal(new Set(world.log.map((e) => e.id)).size, 200)
})

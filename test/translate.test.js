import test from 'node:test'
import assert from 'node:assert/strict'
import { translate } from '../src/ingest/translate.js'

const env = (type, payload) => ({ v: 1, id: '1', ts: '2026-09-29T07:00:00.000Z', type, payload })

test('maps wire field names to reducer events', () => {
  assert.deepEqual(translate(env('read', { heroId: 'h', path: 'a.go', op: 'read' })), { type: 'read', heroId: 'h', file: 'a.go', at: Date.parse('2026-09-29T07:00:00.000Z') })
  assert.equal(translate(env('write', { heroId: 'h', path: 'a.go' })).type, 'edit')
  assert.equal(translate(env('error', { heroId: 'h', errorShort: 'boom' })).error, 'boom')
  assert.equal(translate(env('delegate', { parentId: 'p', sidekick: { id: 's' }, task: 't' })).heroId, 'p')
  assert.equal(translate(env('token_usage', { heroId: 'h', tokensUsed: 5, tokensMax: 10 })).used, 5)
})

test('call_closed becomes call_result only when answered with a decision', () => {
  assert.equal(translate(env('call_closed', { callId: 'c', reason: 'answered', decision: 'approve' })).type, 'call_result')
  assert.deepEqual(translate(env('call_closed', { callId: 'c', reason: 'stale' })), { type: 'call_closed', callId: 'c', reason: 'stale', at: Date.parse('2026-09-29T07:00:00.000Z') })
})

test('call_open parses startedAt and drops null options', () => {
  const ev = translate(env('call_open', { call: { callId: 'c', heroId: 'h', kind: 'ask', options: null, startedAt: '2026-09-29T07:01:00.000Z' } }))
  assert.equal(ev.heroId, 'h')
  assert.equal(ev.call.options, undefined)
  assert.equal(ev.call.startedAt, Date.parse('2026-09-29T07:01:00.000Z'))
})

test('unknown or malformed events return null', () => {
  assert.equal(translate(env('something_new', {})), null)
  assert.equal(translate({ type: 'read' }), null)
  assert.equal(translate(env('cost', { shiftCostUsd: 1 })), null)
  assert.equal(translate(null), null)
})

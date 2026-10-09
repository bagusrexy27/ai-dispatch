import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'

let proc
let base

before(async () => {
  proc = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, PORT: '0', DISPATCH_TOKEN: '' } })
  base = await new Promise((resolve, reject) => {
    proc.stdout.on('data', (d) => {
      const m = String(d).match(/http:\/\/[\d.]+:\d+/)
      if (m) resolve(m[0])
    })
    proc.on('exit', (code) => reject(new Error(`server exited ${code}`)))
  })
})

after(() => proc.kill())

const post = (path, body) => fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
const get = async (path) => (await fetch(`${base}${path}`)).json()

const call = { callId: 'c1', heroId: 'h1', kind: 'choose', quote: 'q', quoteSerious: 'q', techLine: 't', options: [{ id: 'a', label: 'Opsi A' }] }

test('ingest validates events and updates the snapshot', async () => {
  assert.equal((await post('/v1/events', { type: 'read' })).status, 400)
  assert.equal((await post('/v1/events', { type: 'hero_upsert', payload: {} })).status, 400)

  const res = await post('/v1/events', [
    { type: 'hero_upsert', payload: { hero: { id: 'h1', status: 'idle' } } },
    { type: 'status', payload: { heroId: 'h1', status: 'coding' } },
    { type: 'call_open', payload: { call } },
  ])
  assert.equal(res.status, 202)

  const snap = await get('/v1/snapshot')
  assert.equal(snap.heroes[0].status, 'coding')
  assert.equal(snap.openCalls[0].callId, 'c1')
  assert.equal(snap.lastEventId, 3)
  assert.equal(snap.recent.length, 3)
  assert.equal(snap.recent[2].type, 'call_open')
})

test('decision is validated, recorded once, and broadcast as call_closed', async () => {
  assert.equal((await post('/v1/calls/nope/decision', { decision: 'approve' })).status, 404)
  assert.equal((await post('/v1/calls/c1/decision', { decision: 'option', optionId: 'zzz' })).status, 400)
  assert.equal((await post('/v1/calls/c1/decision', { decision: 'other', message: '  ' })).status, 400)

  const stream = await fetch(`${base}/v1/stream?since=3`)
  const reader = stream.body.getReader()

  assert.equal((await post('/v1/calls/c1/decision', { decision: 'option', optionId: 'a' })).status, 202)
  assert.equal((await post('/v1/calls/c1/decision', { decision: 'approve' })).status, 409)

  let text = ''
  while (!text.includes('call_closed')) text += new TextDecoder().decode((await reader.read()).value)
  await reader.cancel()
  const env = JSON.parse(text.match(/data: (.+)/)[1])
  assert.deepEqual(env.payload, { callId: 'c1', reason: 'answered', decision: 'option', optionId: 'a', message: null, optionLabel: 'Opsi A' })

  assert.deepEqual(await get('/v1/calls/c1'), { state: 'answered', decision: { decision: 'option', optionId: 'a', message: null } })
  assert.equal((await get('/v1/snapshot')).openCalls.length, 0)
})

test('stream replays buffered events after the given id', async () => {
  const stream = await fetch(`${base}/v1/stream?since=0`)
  const reader = stream.body.getReader()
  let text = ''
  while ((text.match(/^data: /gm) ?? []).length < 4) text += new TextDecoder().decode((await reader.read()).value)
  await reader.cancel()
  assert.deepEqual(text.match(/^id: (\d+)/gm), ['id: 1', 'id: 2', 'id: 3', 'id: 4'])
})

test('DISPATCH_TOKEN guards ingest and decision', async () => {
  const locked = spawn(process.execPath, ['server/index.js'], {
    env: { ...process.env, PORT: '0', DISPATCH_TOKEN: 'secret' },
  })
  const lockedBase = await new Promise((resolve, reject) => {
    locked.stdout.on('data', (d) => {
      const m = String(d).match(/http:\/\/[\d.]+:\d+/)
      if (m) resolve(m[0])
    })
    locked.on('exit', (code) => reject(new Error(`locked server exited ${code}`)))
  })
  try {
    assert.equal((await fetch(`${lockedBase}/v1/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'hero_upsert', payload: { hero: { id: 'x' } } }),
    })).status, 401)

    assert.equal((await fetch(`${lockedBase}/v1/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer secret' },
      body: JSON.stringify({
        type: 'call_open',
        payload: { call: { callId: 'auth1', heroId: 'x', kind: 'permission', quote: 'q', quoteSerious: 'q', techLine: 't' } },
      }),
    })).status, 202)

    assert.equal((await fetch(`${lockedBase}/v1/calls/auth1/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approve' }),
    })).status, 401)

    assert.equal((await fetch(`${lockedBase}/v1/calls/auth1/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer secret' },
      body: JSON.stringify({ decision: 'approve' }),
    })).status, 202)
  } finally {
    locked.kill()
  }
})

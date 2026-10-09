#!/usr/bin/env node
/**
 * Minimal generic-http emitter for AI Dispatch.
 * Usage: node adapters/generic-http/emit.mjs <upsert|read|edit|call|status|end> [arg]
 */
const BASE = process.env.DISPATCH_URL ?? 'http://127.0.0.1:8787'
const TOKEN = process.env.DISPATCH_TOKEN
const HERO_ID = process.env.HERO_ID ?? 'sess_generic_demo'

const [cmd = 'upsert', arg] = process.argv.slice(2)

async function emit(type, payload) {
  const res = await fetch(`${BASE}/v1/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }),
    },
    body: JSON.stringify({ type, payload }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${type}: ${res.status} ${text}`)
  console.log(type, text)
}

const events = {
  upsert: () => emit('hero_upsert', {
    hero: {
      id: HERO_ID,
      sessionId: HERO_ID,
      model: 'CL',
      variant: 'Sonnet',
      status: 'idle',
      project: 'my-repo',
      branch: 'main',
      task: 'Connected via generic-http',
      tokensUsed: 1000,
      tokensMax: 200000,
      costUsd: 0,
    },
  }),
  read: () => emit('read', { heroId: HERO_ID, path: arg ?? 'README.md', op: 'read' }),
  edit: () => emit('edit', { heroId: HERO_ID, path: arg ?? 'src/main.go', op: 'edit' }),
  status: () => emit('status', { heroId: HERO_ID, status: arg ?? 'coding' }),
  call: () => emit('call_open', {
    call: {
      callId: `call_${Date.now().toString(36)}`,
      heroId: HERO_ID,
      kind: 'permission',
      quote: 'Boss, boleh jalankan perintah ini dari adapter generik?',
      quoteSerious: 'Meminta izin menjalankan perintah.',
      techLine: arg ?? 'echo hello-from-adapter',
      startedAt: new Date().toISOString(),
    },
  }),
  end: () => emit('session_end', { heroId: HERO_ID }),
}

if (!events[cmd]) {
  console.error('Usage: emit.mjs <upsert|read|edit|status|call|end> [arg]')
  process.exit(1)
}

events[cmd]().catch((err) => {
  console.error(err.message)
  process.exit(1)
})

const BASE = process.env.DISPATCH_URL ?? 'http://127.0.0.1:8787'
const TOKEN = process.env.DISPATCH_TOKEN
const POLL_MS = 1000

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const heroId = `sess_fake_${Date.now().toString(36)}`

async function emit(type, payload) {
  const res = await fetch(`${BASE}/v1/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }) },
    body: JSON.stringify({ type, payload }),
  })
  if (!res.ok) throw new Error(`${type}: ${res.status} ${await res.text()}`)
}

async function waitForDecision(callId) {
  for (;;) {
    const res = await fetch(`${BASE}/v1/calls/${callId}`)
    const { state, decision } = await res.json()
    if (state !== 'ringing') return decision
    await sleep(POLL_MS)
  }
}

async function main() {
  await emit('hero_upsert', {
    hero: { id: heroId, sessionId: heroId, model: 'CL', variant: 'Sonnet', status: 'idle', project: 'ai-dispatch', branch: 'feat/live-feed', task: 'Uji jalur SSE', tokensUsed: 1000, tokensMax: 200000, costUsd: 0 },
  })
  await sleep(1500)
  await emit('read', { heroId, path: 'docs/tech/API.md', op: 'read' })
  await sleep(1500)
  await emit('edit', { heroId, path: 'server/index.js', op: 'edit' })
  await emit('token_usage', { heroId, tokensUsed: 24000, tokensMax: 200000 })
  await emit('cost', { heroId, costUsd: 0.12 })
  await sleep(1500)

  const callId = `call_${Date.now().toString(36)}`
  await emit('call_open', {
    call: {
      callId,
      heroId,
      kind: 'permission',
      quote: 'Boss, boleh aku jalankan npm test? Cuma sebentar kok.',
      quoteSerious: 'Meminta izin menjalankan npm test.',
      techLine: 'npm test',
      startedAt: new Date().toISOString(),
    },
  })
  console.log(`Menunggu keputusan operator untuk ${callId}...`)
  const decision = await waitForDecision(callId)
  console.log('Keputusan:', decision)

  if (decision?.decision === 'deny') {
    await emit('status', { heroId, status: 'waiting' })
  } else {
    await emit('status', { heroId, status: 'coding' })
    await sleep(1500)
    await emit('commit', { heroId, sha: Math.random().toString(16).slice(2, 9), message: 'test: cover live feed' })
  }
  await sleep(1500)
  await emit('status', { heroId, status: 'idle' })
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})

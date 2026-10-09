/** Shared client for adapter hooks → AI Dispatch server. */
import { createHash } from 'node:crypto'

export const BASE = process.env.DISPATCH_URL ?? 'http://127.0.0.1:8787'
export const TOKEN = process.env.DISPATCH_TOKEN
/** When `1`, shell/bash tools open a markas call and wait for Y/N. Default: observe only. */
export const GATE = process.env.DISPATCH_GATE === '1'
export const GATE_TIMEOUT_MS = Number(process.env.DISPATCH_GATE_TIMEOUT_MS ?? 300_000)

export function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = []
    process.stdin.on('data', (c) => chunks.push(c))
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'))
      } catch (err) {
        reject(err)
      }
    })
    process.stdin.on('error', reject)
  })
}

export function heroIdFor(sessionKey) {
  const raw = String(sessionKey || 'unknown')
  if (raw.startsWith('sess_')) return raw
  const hash = createHash('sha1').update(raw).digest('hex').slice(0, 10)
  return `sess_${hash}`
}

export function shortPath(p, cwd) {
  if (!p) return '—'
  const s = String(p)
  if (cwd && s.startsWith(cwd)) return s.slice(cwd.length).replace(/^[\\/]/, '') || s
  return s.length > 80 ? `…${s.slice(-77)}` : s
}

export function newCallId() {
  return `call_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export async function emit(type, payload) {
  const res = await fetch(`${BASE}/v1/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }),
    },
    body: JSON.stringify({ type, payload }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${type}: ${res.status} ${text}`)
  }
  return res.json()
}

export async function waitForDecision(callId, { timeoutMs = GATE_TIMEOUT_MS, intervalMs = 800 } = {}) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const res = await fetch(`${BASE}/v1/calls/${encodeURIComponent(callId)}`, {
      headers: { ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }) },
    })
    if (res.ok) {
      const body = await res.json()
      if (body.state !== 'ringing') return body.decision
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  return null
}

export async function upsertHero({ id, model = 'CL', variant = 'local', project, task, status = 'idle' }) {
  await emit('hero_upsert', {
    hero: {
      id,
      sessionId: id,
      model,
      variant,
      status,
      project: project ?? 'workspace',
      branch: '—',
      task: task ?? 'Connected via adapter',
      tokensUsed: 0,
      tokensMax: 200000,
      costUsd: 0,
    },
  })
}

export async function gatePermission({ heroId, techLine, quote }) {
  const callId = newCallId()
  await emit('call_open', {
    call: {
      callId,
      heroId,
      kind: 'permission',
      quote: quote ?? 'Boss, boleh jalankan perintah ini?',
      quoteSerious: 'Meminta izin menjalankan perintah.',
      techLine: String(techLine ?? '').slice(0, 500),
      startedAt: new Date().toISOString(),
    },
  })
  await emit('status', { heroId, status: 'attention' })
  const decision = await waitForDecision(callId)
  const ok = decision?.decision === 'approve' || decision?.decision === 'reply'
  await emit('status', { heroId, status: ok ? 'coding' : 'waiting' })
  return { ok, decision, callId }
}

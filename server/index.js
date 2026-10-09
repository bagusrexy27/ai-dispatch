import http from 'node:http'

const PORT = Number(process.env.PORT ?? 8787)
const HOST = process.env.HOST ?? '127.0.0.1'
const AUTH_TOKEN = process.env.DISPATCH_TOKEN
const BUFFER_CAP = 500
const BODY_LIMIT = 64 * 1024
const HEARTBEAT_MS = 15000
const TEXT_DECISIONS = new Set(['reply', 'other', 'answer'])
const DECISIONS = new Set(['approve', 'deny', 'option', ...TEXT_DECISIONS])

function unauthorized(req) {
  return AUTH_TOKEN && req.headers.authorization !== `Bearer ${AUTH_TOKEN}`
}

const clients = new Set()
const buffer = []
const heroes = new Map()
const calls = new Map()
let seq = 0

function track({ type, payload }) {
  const hero = heroes.get(payload.heroId)
  if (type === 'hero_upsert') heroes.set(payload.hero.id, { ...heroes.get(payload.hero.id), ...payload.hero })
  else if (type === 'session_end') heroes.delete(payload.heroId)
  else if (type === 'status' && hero) hero.status = payload.status
  else if (type === 'token_usage' && hero) Object.assign(hero, { tokensUsed: payload.tokensUsed, tokensMax: payload.tokensMax ?? hero.tokensMax })
  else if (type === 'cost' && hero) hero.costUsd = payload.costUsd
  else if (type === 'call_open') calls.set(payload.call.callId, { call: payload.call, state: 'ringing', decision: null })
  else if (type === 'call_closed' && calls.has(payload.callId)) calls.get(payload.callId).state = payload.reason
}

function publish(type, payload) {
  const env = { v: 1, id: String(++seq), ts: new Date().toISOString(), type, payload }
  track(env)
  buffer.push(env)
  if (buffer.length > BUFFER_CAP) buffer.shift()
  for (const res of clients) res.write(`id: ${env.id}\ndata: ${JSON.stringify(env)}\n\n`)
  return env
}

function validEvent(ev) {
  if (!ev || typeof ev.type !== 'string' || typeof ev.payload !== 'object' || ev.payload === null) return false
  if (ev.type === 'hero_upsert') return typeof ev.payload.hero?.id === 'string'
  if (ev.type === 'call_open') return typeof ev.payload.call?.callId === 'string' && typeof ev.payload.call?.heroId === 'string'
  return true
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(body === undefined ? '' : JSON.stringify(body))
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > BODY_LIMIT) {
        reject(Object.assign(new Error('body too large'), { status: 413 }))
        req.destroy()
      } else chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null'))
      } catch {
        reject(Object.assign(new Error('invalid JSON'), { status: 400 }))
      }
    })
    req.on('error', reject)
  })
}

function openStream(req, res, url) {
  const since = Number(req.headers['last-event-id'] ?? url.searchParams.get('since') ?? 0)
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' })
  res.write('retry: 2000\n\n')
  for (const env of buffer) if (Number(env.id) > since) res.write(`id: ${env.id}\ndata: ${JSON.stringify(env)}\n\n`)
  clients.add(res)
  const beat = setInterval(() => res.write(': ping\n\n'), HEARTBEAT_MS)
  req.on('close', () => {
    clearInterval(beat)
    clients.delete(res)
  })
}

async function ingest(req, res) {
  if (unauthorized(req)) return send(res, 401, { error: 'unauthorized' })
  const body = await readJson(req)
  const events = Array.isArray(body) ? body : [body]
  if (!events.length || !events.every(validEvent)) return send(res, 400, { error: 'expected {type, payload} or an array of them' })
  send(res, 202, { ids: events.map((ev) => publish(ev.type, ev.payload).id) })
}

async function decide(req, res, callId) {
  if (unauthorized(req)) return send(res, 401, { error: 'unauthorized' })
  const entry = calls.get(callId)
  if (!entry) return send(res, 404, { error: 'unknown call' })
  if (entry.state !== 'ringing') return send(res, 409, { error: `call already ${entry.state}` })

  const { decision, optionId = null, message = null } = (await readJson(req)) ?? {}
  if (!DECISIONS.has(decision)) return send(res, 400, { error: 'unknown decision' })
  if (TEXT_DECISIONS.has(decision) && !(typeof message === 'string' && message.trim())) return send(res, 400, { error: 'message required' })
  const option = entry.call.options?.find((o) => o.id === optionId)
  if (decision === 'option' && !option) return send(res, 400, { error: 'unknown optionId' })

  entry.decision = { decision, optionId, message: message?.trim() ?? null }
  publish('call_closed', { callId, reason: 'answered', ...entry.decision, optionLabel: option?.label })
  send(res, 202, { ok: true })
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const callMatch = url.pathname.match(/^\/v1\/calls\/([^/]+)(\/decision)?$/)
  try {
    if (req.method === 'GET' && url.pathname === '/v1/stream') return openStream(req, res, url)
    if (req.method === 'GET' && url.pathname === '/v1/snapshot') {
      const openCalls = [...calls.values()].filter((c) => c.state === 'ringing').map((c) => c.call)
      return send(res, 200, { heroes: [...heroes.values()], openCalls, lastEventId: seq, recent: buffer.slice(-100) })
    }
    if (req.method === 'POST' && url.pathname === '/v1/events') return await ingest(req, res)
    if (callMatch) {
      const callId = decodeURIComponent(callMatch[1])
      if (req.method === 'POST' && callMatch[2]) return await decide(req, res, callId)
      if (req.method === 'GET' && !callMatch[2]) {
        const entry = calls.get(callId)
        return entry ? send(res, 200, { state: entry.state, decision: entry.decision }) : send(res, 404, { error: 'unknown call' })
      }
    }
    send(res, 404, { error: 'not found' })
  } catch (err) {
    send(res, err.status ?? 500, { error: err.status ? err.message : 'internal error' })
  }
})

server.listen(PORT, HOST, () => console.log(`AI Dispatch server on http://${HOST}:${server.address().port}`))

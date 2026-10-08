const FILES = {
  'one-bff-go': ['internal/middleware/auth.go', 'internal/middleware/logger.go', 'api/openapi.yaml', 'cmd/server/main.go'],
  'ops-keuangan': ['go.mod', 'go.sum', 'internal/ledger/posting.go', 'internal/ledger/posting_test.go'],
  'documents-service': ['internal/upload/handler.go', 'docs/contract-upload.md', 'internal/storage/s3.go'],
}

const COMMITS = ['refactor: split auth middleware', 'chore: tidy go modules', 'fix: limit upload size', 'docs: update contract', 'test: cover posting rounding']

const ERRORS = ['go test ./... exit 1', 'lint: unused variable ctx', 'timeout calling staging API', 'merge conflict di go.sum']

const CALLS = [
  {
    kind: 'permission',
    quote: 'Boss, boleh jalankan perintah ini? Janji nggak ngapa-ngapain kok.',
    quoteSerious: 'Meminta izin menjalankan perintah shell.',
    techLine: 'go mod tidy && go build ./...',
  },
  {
    kind: 'permission',
    quote: 'Boss, aku mau hapus folder build lama. Aman kan?',
    quoteSerious: 'Meminta izin menghapus direktori.',
    techLine: 'rm -rf ./dist',
  },
  {
    kind: 'choose',
    quote: 'Boss, ada dua jalan nih. Pilih yang mana?',
    quoteSerious: 'Membutuhkan keputusan pendekatan implementasi.',
    techLine: 'Strategi validasi ukuran upload',
    options: [
      { id: 'mw', label: 'Validasi di middleware' },
      { id: 'handler', label: 'Validasi di handler' },
      { id: 'proxy', label: 'Batasi di reverse proxy' },
    ],
  },
  {
    kind: 'ask',
    quote: 'Boss, env staging pakai database yang mana sih?',
    quoteSerious: 'Membutuhkan informasi konfigurasi.',
    techLine: 'DATABASE_URL tidak ditemukan di .env.staging',
  },
]

const SIDEKICK_TASKS = ['tulis tes', 'cari pemakaian fungsi', 'cek lint', 'baca changelog dependency']
const MAX_SIDEKICKS = 2

const pick = (list) => list[Math.floor(Math.random() * list.length)]
const sha = () => Math.random().toString(16).slice(2, 9)

function primaryEvent(hero) {
  const heroId = hero.id
  const r = Math.random()
  if (r < 0.08) return { type: 'call_open', heroId, call: { ...pick(CALLS), callId: `call-${Date.now()}-${heroId}`, startedAt: Date.now() } }
  if (r < 0.35) return { type: 'read', heroId, file: pick(FILES[hero.project]) }
  if (r < 0.6) return { type: 'edit', heroId, file: pick(FILES[hero.project]) }
  if (r < 0.7) return { type: 'commit', heroId, sha: sha(), message: pick(COMMITS) }
  if (r < 0.78) return { type: 'error', heroId, error: pick(ERRORS) }
  return { type: 'status', heroId, status: pick(['talking', 'waiting', 'idle', 'coding']) }
}

function sidekickEvent(hero, subs, counter) {
  const r = Math.random()
  if (subs.length < MAX_SIDEKICKS && r < 0.07) {
    const n = ++counter[hero.id]
    const status = pick(['coding', 'reading'])
    const sidekick = { id: `${hero.id}-sub${n}`, callsign: `${hero.callsign}-${n + 1}`, status, loc: status === 'coding' ? 'coding' : 'investigate' }
    subs.push(sidekick)
    return { type: 'delegate', heroId: hero.id, sidekick, task: pick(SIDEKICK_TASKS) }
  }
  if (subs.length && r > 0.93) {
    const [done] = subs.splice(Math.floor(Math.random() * subs.length), 1)
    return { type: 'sidekick_end', heroId: hero.id, sidekickId: done.id, sidekickCallsign: done.callsign }
  }
  return null
}

export function startDemoFeed(heroes, dispatch, intervalMs = 2200) {
  const used = Object.fromEntries(heroes.map((h) => [h.id, h.tokensUsed]))
  const subs = Object.fromEntries(heroes.map((h) => [h.id, []]))
  const counter = Object.fromEntries(heroes.map((h) => [h.id, 0]))
  const id = setInterval(() => {
    const hero = pick(heroes)
    used[hero.id] = Math.min(used[hero.id] + 1500 + Math.floor(Math.random() * 4000), hero.tokensMax)
    dispatch(sidekickEvent(hero, subs[hero.id], counter) ?? primaryEvent(hero))
    dispatch({ type: 'token_usage', heroId: hero.id, used: used[hero.id], max: hero.tokensMax })
    dispatch({ type: 'cost', heroId: hero.id, usd: Math.random() * 0.02 })
  }, intervalMs)
  return () => clearInterval(id)
}

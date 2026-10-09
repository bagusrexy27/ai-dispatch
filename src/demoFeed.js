const CALLS = [
  {
    kind: 'permission', heroId: 'byte',
    quote: 'Boss, saya mau jalankan `go mod tidy`. Ini bakal ngubah go.sum. Boleh?',
    quoteSerious: 'Bolt meminta izin menjalankan perintah berikut.',
    techLine: 'perintah: go mod tidy\ncwd: operational-keuangan-service\nefek: mengubah go.mod, go.sum',
  },
  {
    kind: 'choose', heroId: 'nova',
    quote: 'Boss, kontrak header X-User-* versi mana yang saya ikuti? Pilih satu.',
    quoteSerious: 'Nova meminta pilihan kontrak API.',
    techLine: 'konteks: review feat/identity-v2\nfile: docs/api-contract.md',
    options: [
      { id: 'a', label: 'Ikuti draft BFF terbaru (X-User-ID + Email + Name)' },
      { id: 'b', label: 'Tetap kontrak lama (hanya X-User-ID)' },
      { id: 'c', label: 'Tunda review — tunggu ADR selesai' },
    ],
  },
  {
    kind: 'ask', heroId: 'ivy',
    quote: 'Boss, path upload dokumen yang dipakai yang mana? Saya bingung antara dua handler.',
    quoteSerious: 'Ivy menanyakan path upload yang benar.',
    techLine: 'repo: documents-service\nkandidat:\n  · POST /upload\n  · POST /v1/documents',
  },
  {
    kind: 'permission', heroId: 'kilo',
    quote: 'Test-nya merah terus. Saya boleh hapus test yang flaky?',
    quoteSerious: 'Vex meminta izin menghapus file test.',
    techLine: 'aksi: hapus file\npath: app/service/realisasi_flaky_test.go',
  },
]

const SCRIPT = [
  { type: 'status', heroId: 'ivy', status: 'coding' },
  { type: 'commit', heroId: 'rex', sha: 'b7e21d0', message: 'identity: baca X-User-Email' },
  { type: 'status', heroId: 'kilo', status: 'coding' },
  { type: 'read', heroId: 'rex', file: 'internal/middleware/auth_test.go' },
  { type: 'status', heroId: 'nova', status: 'reading' },
  { type: 'status', heroId: 'mochi', status: 'reading' },
  { type: 'error', heroId: 'kilo', error: 'FAIL TestRounding' },
  { type: 'edit', heroId: 'byte', file: 'go.sum' },
  { type: 'status', heroId: 'ivy', status: 'idle' },
  { type: 'status', heroId: 'nova', status: 'talking', radioTo: 'rex' },
  { type: 'commit', heroId: 'byte', sha: 'c0ffee1', message: 'bump go-common' },
  { type: 'status', heroId: 'mochi', status: 'idle' },
  { type: 'status', heroId: 'kilo', status: 'waiting' },
  { type: 'edit', heroId: 'rex', file: 'internal/middleware/identity.go' },
  { type: 'status', heroId: 'ivy', status: 'reading' },
]

const SIDEKICK = { id: 'rex-sub1', callsign: 'Rex-2', status: 'reading', loc: 'investigate' }
const TICK_MS = 3800
const CALL_GAP_MS = 10000

/* demo deterministik: semua hero mulai di HQ, berangkat bergiliran, lalu skrip berputar */
export function startDemoFeed(heroes, dispatch, getWorld) {
  const timers = []
  const later = (ms, fn) => timers.push(setTimeout(fn, ms))
  const usage = Object.fromEntries(heroes.map((h) => [h.id, { used: h.tokensUsed, cost: h.costUsd, max: h.tokensMax }]))
  let step = 0
  let callIdx = 0
  let quietSince = Date.now()

  heroes.filter((h) => h.target !== h.status).forEach((h, i) => {
    later(400 + i * 450, () => dispatch({ type: 'status', heroId: h.id, status: h.target, radioTo: h.radioTo }))
  })
  later(2200, () => dispatch({ type: 'delegate', heroId: 'rex', sidekick: SIDEKICK, task: 'cari pola test middleware' }))
  later(4600, openCall)

  function openCall() {
    const tpl = CALLS[callIdx++ % CALLS.length]
    dispatch({ type: 'call_open', heroId: tpl.heroId, call: { ...tpl, callId: `call-${Date.now()}`, startedAt: Date.now() } })
  }

  function tick() {
    const world = getWorld()
    if (world.calls.length) quietSince = Date.now()
    else if (Date.now() - quietSince > CALL_GAP_MS) {
      quietSince = Date.now()
      return openCall()
    }

    const ev = SCRIPT[step++ % SCRIPT.length]
    const hero = world.heroes.find((h) => h.id === ev.heroId)
    if (!hero || hero.status === 'attention') return
    dispatch(ev)

    const u = usage[hero.id]
    u.used = Math.min(u.used + 2000 + ((step * 1300) % 5000), u.max)
    u.cost += 0.01
    dispatch({ type: 'token_usage', heroId: hero.id, used: u.used, max: u.max })
    dispatch({ type: 'cost', heroId: hero.id, costUsd: u.cost })
  }

  const interval = setInterval(tick, TICK_MS)
  return () => {
    clearInterval(interval)
    timers.forEach(clearTimeout)
  }
}

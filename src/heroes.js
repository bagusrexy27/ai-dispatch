/* status = posisi awal sebelum demo memberangkatkan hero dari HQ (target) */
const heroes = [
  {
    id: 'rex', sessionId: 'sess_8f2a91c', callsign: 'Rex', model: 'CL', variant: 'Opus', status: 'idle', target: 'coding',
    project: 'one-bff-go', task: 'Refactor middleware identity', branch: 'feat/identity-v2',
    tokensUsed: 124000, tokensMax: 200000, costUsd: 0.84, stats: [9, 5, 3, 2, 6],
    files: [{ op: 'read', path: 'internal/session/redis.go' }, { op: 'edit', path: 'internal/middleware/identity.go' }],
    history: ['✗ go vet: unused import', '✓ a1c9e2f tambah header X-User-Email'],
  },
  {
    id: 'nova', sessionId: 'sess_77d01ab', callsign: 'Nova', model: 'GP', variant: '5.6', status: 'idle', target: 'talking', radioTo: 'rex',
    project: 'one-bff-go', task: 'Review kontrak header X-User-*', branch: 'feat/identity-v2',
    tokensUsed: 76000, tokensMax: 200000, costUsd: 0.21, stats: [2, 7, 9, 3, 1],
    files: [{ op: 'read', path: 'docs/api-contract.md' }],
    history: ['✓ review: 2 catatan'],
  },
  {
    id: 'byte', sessionId: 'sess_3be44c0', callsign: 'Bolt', model: 'CL', variant: 'Sonnet', status: 'idle', target: 'coding',
    project: 'operational-keuangan', task: 'Bump go-common ke versi terbaru', branch: 'chore/bump-go-common',
    tokensUsed: 176000, tokensMax: 200000, costUsd: 0.31, stats: [7, 6, 2, 5, 4],
    files: [{ op: 'read', path: 'CLAUDE.md' }, { op: 'read', path: 'main.go' }, { op: 'edit', path: 'go.mod' }],
    history: ['✓ 9f03b1d update import path'],
  },
  {
    id: 'ivy', sessionId: 'sess_c1a2090', callsign: 'Ivy', model: 'GM', variant: '3.8 Flash', status: 'idle', target: 'reading',
    project: 'documents-service', task: 'Baca kontrak upload dokumen', branch: 'main',
    tokensUsed: 42000, tokensMax: 200000, costUsd: 0.05, stats: [3, 9, 2, 1, 1],
    files: [{ op: 'read', path: 'docs/API.md' }, { op: 'read', path: 'internal/handler/upload.go' }],
    history: [],
  },
  {
    id: 'kilo', sessionId: 'sess_5520fe1', callsign: 'Vex', model: 'GK', variant: '4.7', status: 'idle', target: 'waiting',
    project: 'bsc-be', task: 'Menunggu hasil go test ./...', branch: 'fix/realisasi-rounding',
    tokensUsed: 94000, tokensMax: 200000, costUsd: 0.12, stats: [6, 3, 1, 8, 5],
    files: [{ op: 'edit', path: 'app/service/realisasi.go' }],
    history: ['✓ 44ab7c0 fix pembulatan realisasi'],
  },
  {
    id: 'mochi', sessionId: 'sess_09e1d3a', callsign: 'Mochi', model: 'CL', variant: 'Haiku', status: 'idle', target: 'idle',
    project: '—', task: '—', branch: '—',
    tokensUsed: 8000, tokensMax: 200000, costUsd: 0.01, stats: [3, 3, 2, 1, 2],
    files: [],
    history: ['✓ selesai: rapikan README'],
  },
]

export default heroes

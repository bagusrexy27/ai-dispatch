# Domain model — AI Dispatch

| Field | Value |
|-------|-------|
| Status | Draft v1 · 2026-09-29 |
| Sumber | [`design-style.md`](../../design-style.md) §3–§4 |

## Entitas inti

### Hero (agen)

| Field | Tipe | Catatan |
|-------|------|---------|
| `id` | string | Id sesi/agen di sumber |
| `callsign` | string | Deterministik dari hash `sessionId` (daftar kata tetap) |
| `sessionId` | string | Id asli; tampil di detail |
| `model` | enum badge | CL / GP / GM / GK / … |
| `variant` | string | Mis. Sonnet, 3.5 Flash |
| `status` | Status | Lihat tabel status |
| `loc` | LocationId | `hq` · `coding` · `radio` · `investigate` · `standby` · (jalan = transit) |
| `project` | string | Repo/tag; **bukan** tempat di peta |
| `task` | string | Judul tugas aktif |
| `branch` | string | |
| `tokensUsed` / `tokensMax` | number | Stamina |
| `costUsd` | number | Budget per hero |
| `stats` | `[5] number` | Coding, Membaca, Koordinasi, Menunggu, Shipping (1 jam terakhir) |
| `files` | `{op, path}[]` | 5 terakhir |
| `history` | string[] | Ringkas commit/error |
| `sidekicks` | Sidekick[] | |

### Sidekick (subagent)

| Field | Catatan |
|-------|---------|
| `id`, `callsign`, `status`, `loc` | Token lebih kecil; tali teal ke induk |
| `parentId` | Hero induk |

### Location (gedung kerja)

| Id | Label game | Status yang mengisi |
|----|------------|---------------------|
| `hq` | HQ | idle + transit semua rute |
| `coding` | Bengkel Kode | coding |
| `radio` | Menara Radio | talking |
| `investigate` | Perpustakaan | reading |
| `standby` | Ruang Tunggu | waiting |
| `dock` | Dermaga Kirim | tujuan paket commit (bukan tempat hero) |

### Status

| Status | Label | Lokasi |
|--------|-------|--------|
| `coding` | ON MISSION | Bengkel Kode |
| `reading` | MENYELIDIKI | Perpustakaan |
| `talking` | DI RADIO | Menara Radio |
| `waiting` | STANDBY | Ruang Tunggu |
| `idle` | DI MARKAS | HQ |
| `attention` | NELPON MARKAS | tetap di gedung + ring merah |
| `traveling` | MENUJU {gedung} | di jalan (via HQ) |

### IncomingCall

| Field | Catatan |
|-------|---------|
| `callId` | unik |
| `heroId` | |
| `kind` | `permission` · `choose` · `ask` |
| `quote` / `quoteSerious` | kutipan (boleh komedi) |
| `techLine` | baris `▸` — teks asli, tidak diubah |
| `options?` | `{ id, label }[]` untuk `choose` |
| `state` | `ringing` · `sending` · `answered` · `failed` · `stale` |
| `startedAt` | untuk timer panel |

### OperatorDecision

| Field | Catatan |
|-------|---------|
| `callId` | |
| `decision` | `approve` · `deny` · `reply` · `option` · `other` · `answer` |
| `optionId?` | jika `option` |
| `message?` | balasan teks |

### World / Shift (agregat UI)

| Field | Catatan |
|-------|---------|
| `shiftLabel` | mis. SHIFT 1 |
| `clock` | jam UI |
| `budgetTotal` | header |
| `heroesActive` / `heroesDone` | ringkasan |
| `seriousMode` | toggle copy |
| `sfx` / `music` | preferensi lokal |

## Aturan domain

1. **Hub-and-spoke**: setiap pindah lokasi lewat HQ, ikuti jalan (bukan garis lurus antar gedung).
2. **Callsign stabil**: hash `sessionId` → callsign yang sama = sesi yang sama.
3. **Attention tidak memindahkan** hero; hanya status + UI call.
4. **Satu putaran jawab per call**; pertanyaan baru = call baru.
5. **Tidak ada auto-decision** / timeout yang memilih opsi.

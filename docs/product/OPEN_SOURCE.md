# Open source — AI Dispatch

| Field | Value |
|-------|-------|
| Status | Draft v1 · 2026-10-09 |
| License | MIT ([`LICENSE`](../../LICENSE)) |
| Tujuan | Orang bisa `install` lalu langsung pakai, tanpa wajib backend atau agen lokal |

## 1. Visi

AI Dispatch adalah **open source, single-player dulu, multi-agent ready**:

1. Clone / install → `npm install` → `npm run dev` → markas jalan (demo penuh).
2. Opsional: nyalakan server SSE + adapter ke agen coding lokal.
3. Tidak ada SaaS wajib, tidak ada “agent global” milik vendor.

Demo mode adalah jalur utama untuk kontributor dan pengguna baru. Live mode dan adapter adalah add-on.

## 2. Tiga lapisan (jangan digabung paksa)

```text
┌─────────────────────────────────────────────┐
│  Layer 1 — Core (wajib)                     │
│  UI React + demo feed offline               │
│  npm install && npm run dev                 │
└─────────────────────────────────────────────┘
                    │ opsional
┌─────────────────────────────────────────────┐
│  Layer 2 — Server (opsional)                │
│  SSE stream + decision + ingest             │
│  npm run server && npm run dev:live         │
└─────────────────────────────────────────────┘
                    │ opsional
┌─────────────────────────────────────────────┐
│  Layer 3 — Adapter (opsional / plugin)      │
│  Cursor · Claude Code · generic HTTP        │
│  Source → event API.md → server             │
└─────────────────────────────────────────────┘
```

| Lapisan | Siapa | Syarat |
|---------|-------|--------|
| Core | Semua orang | Node.js + browser |
| Server | Operator yang mau agen nyata | Port lokal bebas |
| Adapter | Integrator / power user | Hook/log sumber agen |

## 3. Prinsip distribusi

- **Demo default** — first run harus terasa seperti mockup (peta, hero, call, SFX/musik).
- **Zero config untuk core** — tanpa `.env` untuk `npm run dev`.
- **Live tidak memblokir install** — gagal server ≠ gagal coba produk.
- **Satu sesi = satu hero** — callsign dari hash `sessionId`; bukan “agen global” tunggal.
- **Adapter di luar core** — jangan hardcode proprietary API di bundle UI.
- **Lokal dulu aman** — server default bind `127.0.0.1`; token ingest kalau diexpose.

## 4. Pengalaman install (target)

```bash
git clone <repo>
cd ai-dispatch
npm install
npm run dev
# buka URL yang dicetak Vite (biasanya http://localhost:5173)
```

Verifikasi cepat (core):

1. Header **AI Dispatch**, roster hero dengan wajah.
2. Peta kota wireframe bergerak.
3. Panggilan masuk bisa dijawab (Y/N/R atau opsi).
4. Toggle **SFX** / **Musik** / **Mode serius** bereaksi.

Live (opsional) — lihat [`../tech/SETUP.md`](../tech/SETUP.md).

## 5. Roadmap open source

| Prioritas | Item | Status | Catatan |
|-----------|------|--------|---------|
| P0 | README 30 detik + LICENSE | Done | MIT + quick start |
| P0 | `npm install && npm run dev` stabil | Done | Node ≥20; `npm test` / lint / build hijau |
| P1 | CONTRIBUTING + konvensi commit | Done | Conventional commits |
| P1 | Dokumen “connect your agent” | Done | [`../tech/CONNECT_AGENT.md`](../tech/CONNECT_AGENT.md) |
| P1 | Scaffold `adapters/` | Done | `generic-http` starter + indeks |
| P2 | Adapter Cursor / Claude Code | Todo | Hook/session log |
| P2 | Auth jika server diexpose | Partial | `DISPATCH_TOKEN` untuk ingest; decision masih lokal |
| P3 | Publish npm / template | Todo | Setelah API event stabil |
| P3 | Multi-operator / room | Todo | Bukan blocker MVP OSS |

Non-goals tetap mengikuti [`PRD.md`](./PRD.md) §6 (bukan multi-tenant SaaS, bukan autopilot call).

## 6. Kontribusi

Lihat [`CONTRIBUTING.md`](../../CONTRIBUTING.md). Ringkas:

- Bug/fitur core: UI, demo feed, copy, peta.
- Server: kontrak [`../tech/API.md`](../tech/API.md) menang.
- Adapter baru: terjemahkan sumber → event normal; jangan ubah UI supaya tahu merek agen.

## 7. Relasi dokumen

| Dokumen | Isi |
|---------|-----|
| [`PRD.md`](./PRD.md) | Masalah, goals produk |
| [`../tech/ARCHITECTURE.md`](../tech/ARCHITECTURE.md) | Layer teknis |
| [`../tech/INTEGRATION.md`](../tech/INTEGRATION.md) | Pola adapter |
| [`../tech/CONNECT_AGENT.md`](../tech/CONNECT_AGENT.md) | Panduan sambung agen lokal |
| [`../tech/SETUP.md`](../tech/SETUP.md) | Runbook install & live |
| [`../../adapters/`](../../adapters/) | Starter adapter |
| [`CONTRIBUTING.md`](../../CONTRIBUTING.md) | Cara berkontribusi |

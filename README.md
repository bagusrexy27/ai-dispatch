# AI Dispatch

Pemantau agen AI coding bergaya game *Dispatch*: operator jadi dispatcher, agen jadi hero di peta kota. Lihat sekilas siapa sedang apa, di repo mana, dan jawab saat hero nelpon markas.

**Open source (MIT)** — tujuan distribusi: *install dan langsung bisa dipakai*. Demo penuh jalan tanpa backend. Live agent opsional.

Dokumen visi OSS: [`docs/product/OPEN_SOURCE.md`](docs/product/OPEN_SOURCE.md).

## Quick start (30 detik)

Butuh [Node.js](https://nodejs.org/) 20+.

```bash
git clone <repo-url> ai-dispatch
cd ai-dispatch
npm install
npm run dev
```

Buka URL yang dicetak Vite (biasanya `http://localhost:5173`).

Kamu harus melihat: header **AI Dispatch**, peta kota, roster hero, radio log, dan panggilan masuk yang bisa dijawab. Toggle **SFX**, **Musik**, dan **Mode serius** ada di header.

Tidak perlu `.env` untuk mode ini.

## Live mode (opsional)

Sambungkan event agen sungguhan lewat server lokal:

```bash
npm run server      # http://127.0.0.1:8787
npm run dev:live    # UI → /v1/stream (proxy Vite)
npm run agent:fake  # contoh agen: event + panggilan + tunggu keputusan
```

Agen/adapter: `POST /v1/events`, baca keputusan lewat `GET /v1/calls/{callId}`.  
Panduan praktis: [`docs/tech/CONNECT_AGENT.md`](docs/tech/CONNECT_AGENT.md) · kontrak [`API.md`](docs/tech/API.md) · runbook [`SETUP.md`](docs/tech/SETUP.md) · starter [`adapters/`](adapters/).

## Shortcut

| Tombol | Aksi |
|--------|------|
| `1`–`9` | Pilih hero di roster |
| `Space` | Fokus panggilan teratas |
| `Y` / `N` / `R` | Setujui / tolak / balas (permission) |
| `1`–`9` | Pilih opsi (choose, saat panggilan fokus) |
| `Ctrl+Enter` | Kirim teks balasan/jawaban |
| `Esc` | Tutup detail hero |

## Scripts

| Script | Fungsi |
|--------|--------|
| `npm run dev` | UI + demo feed (default) |
| `npm run build` / `preview` | Build produksi |
| `npm test` | Tes reducer, translate, server |
| `npm run lint` | ESLint |
| `npm run server` | Backend SSE/decision/ingest |
| `npm run dev:live` | UI mode SSE |
| `npm run agent:fake` | Agen contoh |

## Struktur

| Path | Isi |
|------|-----|
| `src/` | UI, world reducer, demo feed, peta |
| `src/ingest/` | Klien SSE + translate wire → reducer |
| `server/` | Server tanpa dependency + fake agent |
| `adapters/` | Starter sambung agen (generic-http) |
| `test/` | `node --test` |
| `docs/product/` | PRD, domain, events, **open source** |
| `docs/tech/` | API, architecture, setup, integration |
| `mockup.html` | Referensi visual interaktif |

## Dokumen

- OSS: [`docs/product/OPEN_SOURCE.md`](docs/product/OPEN_SOURCE.md)
- Kontribusi: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Produk: [`docs/product/PRD.md`](docs/product/PRD.md), [`DOMAIN.md`](docs/product/DOMAIN.md), [`EVENTS.md`](docs/product/EVENTS.md)
- Teknis: [`docs/tech/API.md`](docs/tech/API.md), [`ARCHITECTURE.md`](docs/tech/ARCHITECTURE.md), [`SETUP.md`](docs/tech/SETUP.md), [`INTEGRATION.md`](docs/tech/INTEGRATION.md)

## License

[MIT](LICENSE)

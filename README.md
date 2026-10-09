# AI Dispatch

Pemantau agen AI coding bergaya game *Dispatch*: operator jadi dispatcher, agen jadi hero di peta kota. Lihat sekilas siapa sedang apa, di repo mana, dan jawab saat hero nelpon markas.

## Jalankan

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint
npm run build
```

Tanpa backend: **Demo feed** (toggle di header) menghasilkan event palsu secara offline.

Dengan agen sungguhan (SSE):

```bash
npm run server      # backend kecil tanpa dependency, http://127.0.0.1:8787
npm run dev:live    # UI tersambung ke /v1/stream
npm run agent:fake  # contoh agen: kirim event, nelpon markas, tunggu keputusan
```

Agen/adapter mengirim event ke `POST /v1/events` dan membaca keputusan dari `GET /v1/calls/{callId}`. Kontrak lengkap di [`docs/tech/API.md`](docs/tech/API.md), runbook di [`docs/tech/SETUP.md`](docs/tech/SETUP.md).

## Shortcut

| Tombol | Aksi |
|--------|------|
| `1`–`9` | Pilih hero di roster |
| `Space` | Fokus panggilan teratas |
| `Y` / `N` / `R` | Setujui / tolak / balas (permission) |
| `1`–`9` | Pilih opsi (choose, saat panggilan fokus) |
| `Ctrl+Enter` | Kirim teks balasan/jawaban |
| `Esc` | Tutup detail hero |

## Struktur

| File | Isi |
|------|-----|
| `src/world.js` | State dunia + reducer `applyEvent` (satu-satunya jalur update) |
| `src/demoFeed.js` | Feeder event offline |
| `src/ingest/` | Klien SSE + `translate` event wire → event reducer |
| `server/` | Server stream/decision/ingest + agen palsu |
| `test/` | `node --test` untuk reducer, translate, server |
| `src/MapView.jsx` | Peta kota, perjalanan via HQ, sidekick, stempel, paket commit |
| `src/IncomingCall.jsx` | Panel panggilan `permission` · `choose` · `ask` |
| `src/lib/status.js` | Status, lokasi, badge model |
| `src/lib/copy.js` | Teks radio log (normal & mode serius) |

## Dokumen

- Produk: [`docs/product/PRD.md`](docs/product/PRD.md), [`DOMAIN.md`](docs/product/DOMAIN.md), [`EVENTS.md`](docs/product/EVENTS.md)
- Teknis: [`docs/tech/API.md`](docs/tech/API.md), [`FRONTEND.md`](docs/tech/FRONTEND.md), [`ARCHITECTURE.md`](docs/tech/ARCHITECTURE.md)

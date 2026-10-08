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
| `src/MapView.jsx` | Peta kota, perjalanan via HQ, sidekick, stempel, paket commit |
| `src/IncomingCall.jsx` | Panel panggilan `permission` · `choose` · `ask` |
| `src/lib/status.js` | Status, lokasi, badge model |
| `src/lib/copy.js` | Teks radio log (normal & mode serius) |

## Dokumen

- Produk: [`docs/product/PRD.md`](docs/product/PRD.md), [`DOMAIN.md`](docs/product/DOMAIN.md), [`EVENTS.md`](docs/product/EVENTS.md)
- Teknis: [`docs/tech/API.md`](docs/tech/API.md), [`FRONTEND.md`](docs/tech/FRONTEND.md), [`ARCHITECTURE.md`](docs/tech/ARCHITECTURE.md)

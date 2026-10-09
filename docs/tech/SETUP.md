# Setup / runbook

| Field | Value |
|-------|-------|
| Status | Draft v2 · 2026-10-09 |
| Distribusi | Open source — lihat [`../product/OPEN_SOURCE.md`](../product/OPEN_SOURCE.md) |

## Prasyarat

- Node.js **20+** (LTS disarankan)
- Browser modern (Chrome / Firefox / Edge / Safari)

## Layer 1 — Core (wajib, zero config)

Ini jalur resmi untuk pengguna baru dan kontributor:

```bash
npm install
npm run dev        # demo feed offline
```

Buka URL Vite (biasanya `http://localhost:5173`). Tidak perlu `.env`.

Verifikasi:

1. Header **AI Dispatch**, jam, budget, roster dengan wajah hero.
2. Peta kota wireframe; hero berpindah gedung.
3. Panggilan masuk; Y/N/R atau opsi jalan.
4. Toggle **SFX** / **Musik** / **Mode serius** bereaksi (klik dulu agar AudioContext aktif).

Tes & build:

```bash
npm test
npm run lint
npm run build
npm run preview
```

## Layer 2 — Live (SSE, opsional)

```bash
npm run server     # http://127.0.0.1:8787
npm run dev:live   # Vite memproxy /v1 → server
npm run agent:fake # contoh agen: event + call + tunggu keputusan
```

| Var | Arti |
|-----|------|
| `VITE_FEED_MODE` | `sse` untuk live (sama dengan `--mode live`); default demo |
| `VITE_API_BASE` | base URL backend jika tidak lewat proxy Vite |
| `PORT` / `HOST` | server, default `8787` / `127.0.0.1` |
| `DISPATCH_TOKEN` | jika diset, `POST /v1/events` wajib Bearer token |
| `DISPATCH_URL` | target proxy Vite & fake agent |

Server menyimpan state di **memori** (restart = kosong). Default hanya localhost.

Kalau diexpose ke LAN:

1. Set `DISPATCH_TOKEN` (wajib Bearer di `POST /v1/events`).
2. Pertimbangkan firewall; decision endpoint masih tanpa auth (operator lokal) — jangan expose publik tanpa proxy/auth tambahan.
3. `HOST=0.0.0.0` hanya jika sadar risikonya.

## Layer 3 — Adapter agen lokal (opsional)

Panduan langkah demi langkah: [`CONNECT_AGENT.md`](./CONNECT_AGENT.md).

1. Emit event normal ke `POST /v1/events` (lihat [`API.md`](./API.md)).
2. Poll `GET /v1/calls/{callId}` dan forward keputusan ke agen.
3. Starter: `npm run agent:fake` · `node adapters/generic-http/emit.mjs upsert` · [`../adapters/`](../../adapters/).

Cursor / Claude Code: planned (belum di repo inti).

## Mockup visual (referensi)

```bash
python -m http.server 9876 --bind 127.0.0.1
# http://127.0.0.1:9876/mockup.html
```

Atau buka `mockup.html` langsung (audio `file://` bisa diblokir browser).

## Troubleshooting

| Gejala | Cek |
|--------|-----|
| Port Vite bentrok | Vite akan tawar port lain; atau `--port 5173 --strictPort` |
| Port server bentrok | `PORT=8788 npm run server` |
| ERR_CONNECTION di tools browser | Bind `127.0.0.1`, port unik |
| Tanpa suara | Nyalakan SFX/Musik di header (butuh klik pengguna) |
| Live kosong | Pastikan `server` jalan sebelum `dev:live`; cek proxy `/v1` |

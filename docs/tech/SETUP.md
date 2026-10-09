# Setup / runbook

| Field | Value |
|-------|-------|
| Status | Draft v1 · 2026-09-29 |

## Sekarang (mockup)

```bash
cd D:\Code\ai-dispatch
python -m http.server 9876 --bind 127.0.0.1
# buka http://127.0.0.1:9876/mockup.html
```

Atau buka `mockup.html` langsung (audio `file://` bisa diblokir browser).

## App

```bash
npm install
npm run dev        # mode demo (feeder offline)
npm test           # reducer, translate, server
npm run build
```

## Mode live (SSE)

```bash
npm run server     # http://127.0.0.1:8787
npm run dev:live   # Vite memproxy /v1 ke server
npm run agent:fake # agen palsu: kirim event + buka call + tunggu keputusan
```

| Var | Arti |
|-----|------|
| `VITE_FEED_MODE` | `sse` untuk live (sama dengan `--mode live`); default demo |
| `VITE_API_BASE` | base URL backend jika tidak lewat proxy Vite |
| `PORT` / `HOST` | server, default `8787` / `127.0.0.1` |
| `DISPATCH_TOKEN` | jika diset, `POST /v1/events` wajib Bearer token |
| `DISPATCH_URL` | target proxy Vite & fake agent |

Server menyimpan state di memori saja (restart = kosong). Endpoint decision belum diautentikasi; server bind ke localhost.

## Verifikasi cepat

1. Mockup: roster 6 hero, peta HQ, radio log bergerak.
2. Trigger call di mockup: panel kind benar, Y/N/R jalan.
3. Mode serius: copy log berganti lugas.
4. App: demo feeder menghasilkan travel + stempel commit.

## Troubleshooting

| Gejala | Cek |
|--------|-----|
| Port 8765 gagal | Pakai port lain (mis. 9876) |
| Cursor browser ERR_CONNECTION | Pastikan server bind `127.0.0.1` dan port unik |
| Tanpa suara | Nyalakan SFX di header; hindari `file://` untuk audio |

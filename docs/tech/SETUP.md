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

## Target app (setelah scaffold)

```bash
pnpm install   # atau npm / bun
pnpm dev
pnpm build
pnpm preview
```

Env usulan:

| Var | Arti |
|-----|------|
| `VITE_FEED_MODE` | `demo` \| `sse` \| `ws` |
| `VITE_API_BASE` | base URL backend |
| `VITE_SFX_DEFAULT` | `0`/`1` |

## Backend (opsional)

TBD setelah ADR transport final. Minimal: stream + decision + snapshot.

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

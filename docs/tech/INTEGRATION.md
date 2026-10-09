# Integration adapters

| Field | Value |
|-------|-------|
| Status | Draft v2 · 2026-10-09 |
| Tujuan | Sumber agen mentah → event normal [`API.md`](./API.md) |
| Lapisan OSS | Layer 3 — opsional; core UI tetap jalan tanpa adapter ([`OPEN_SOURCE.md`](../product/OPEN_SOURCE.md)) |

## Pola

```text
Source hook/log/API  →  Adapter.translate()  →  Event envelope  →  bus/stream
Operator decision    ←  Adapter.forwardDecision()  ←  POST decision
```

Setiap adapter:

1. **Identify** sesi → `hero.id` / `sessionId`
2. **Map status** sumber → `coding|reading|talking|waiting|idle|attention`
3. **Map lokasi** dari status (tabel domain)
4. **Emit** event tiped; jangan kirim string UI sudah digayakan (copy dilakukan di client)
5. **Forward** decision ke mekanisme asli (approve tool, kirim pesan, dll.)

## Adapter MVP (usulan)

| Id | Sumber | Catatan |
|----|--------|---------|
| `demo` | Timer in-process (`src/demoFeed.js`) | Wajib di core; first-run OSS |
| `fake` | `server/fake-agent.js` | Contoh live tanpa hook proprietary |
| `generic-http` | `adapters/generic-http/` | Starter POST event |
| `cursor` | `adapters/cursor/` | Hook `hooks.json` → event (+ gate shell opsional) |
| `claude-code` | `adapters/claude-code/` | Hook settings → event (+ gate Bash opsional) |

Panduan praktis: [`CONNECT_AGENT.md`](./CONNECT_AGENT.md).

Detail binding sumber nyata diisi saat sumber dipilih; jangan hardcode proprietary di core UI. Adapter boleh hidup di folder `adapters/` atau repo terpisah.

## Decision forwarding

| Call kind | Forward tipikal |
|-----------|-----------------|
| `permission` | approve/deny tool atau inject reply |
| `choose` | kirim `optionId` atau teks `other` ke agen |
| `ask` | kirim `message` sebagai user reply |

Jika forward gagal → `call_closed.reason = failed` + notice di stream.

## Callsign

`callsign = wordList[hash(sessionId) % wordList.length]` — daftar kata di `src/lib/callsign.ts`, sama di semua adapter (client boleh hitung ulang untuk konsistensi demo).

## Keamanan

- Adapter tidak mengekspos secret ke browser.
- Browser hanya terima event sudah disanitasi (path, error_short dipotong).
- Decision endpoint hanya untuk call terbuka milik stream yang diautentikasi (auth detail = follow-up).

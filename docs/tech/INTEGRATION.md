# Integration adapters

| Field | Value |
|-------|-------|
| Status | Draft v1 · 2026-09-29 |
| Tujuan | Sumber agen mentah → event normal [`API.md`](./API.md) |

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
| `demo` | Timer in-process | Wajib; deterministic seed untuk QA |
| `cursor` / `claude-code` | Hook/session log (TBD) | Prioritas produk lokal |
| `generic-http` | Webhook POST event sudah normal | Integrasi custom |

Detail binding sumber nyata diisi saat sumber dipilih; jangan hardcode proprietary di core.

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

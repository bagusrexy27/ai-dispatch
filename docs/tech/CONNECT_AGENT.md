# Connect your agent

| Field | Value |
|-------|-------|
| Status | Draft v1 · 2026-10-09 |
| Lapisan | OSS Layer 3 (opsional) |
| Prasyarat | Layer 2 hidup — [`SETUP.md`](./SETUP.md) |

Panduan praktis: agen coding lokalmu muncul di markas seperti hero demo, tanpa mengubah UI Dispatch.

## 1. Alur

```text
Agen lokal                AI Dispatch server              Browser
─────────                 ──────────────────              ───────
kerja / tool call  ──►  POST /v1/events
izin / tanya       ──►  call_open
                        GET /v1/stream  ──────────────►  peta + call panel
operator Y/N/R     ◄──  POST .../decision
poll keputusan     ◄──  GET /v1/calls/{id}
lanjut / standby
```

Kontrak wire: [`API.md`](./API.md). Pola adapter: [`INTEGRATION.md`](./INTEGRATION.md).  
Contoh jalan: `npm run agent:fake` (`server/fake-agent.js`).

## 2. Checklist minimal

1. `npm run server` lalu `npm run dev:live`.
2. Adapter punya **satu `heroId` stabil** per sesi (biasanya `sessionId`).
3. Saat sesi mulai → `hero_upsert` (sertakan `model`, `variant`, `project`, `task`).
4. Saat baca/edit file → `read` / `edit` (path di `payload.path`).
5. Saat butuh manusia → `call_open` (`permission` | `choose` | `ask`).
6. Poll `GET /v1/calls/{callId}` sampai `state !== "ringing"`, lalu forward `decision` ke agen.
7. Saat selesai → `session_end` (opsional tapi rapi).

Callsign dan wajah hero dihitung di client dari `sessionId` + `model`/`variant`. Adapter **tidak** perlu mengirim nama hero bergaya game.

## 3. Event yang paling sering

| Situasi | `type` | Field penting |
|---------|--------|----------------|
| Sesi baru | `hero_upsert` | `hero.id`, `model`, `status` |
| Status kerja | `status` | `heroId`, `status` (`coding`/`reading`/…) |
| Baca file | `read` | `heroId`, `path` |
| Edit file | `edit` / `write` | `heroId`, `path` |
| Commit | `commit` | `heroId`, `sha`, `message` |
| Error | `error` | `heroId`, `errorShort` |
| Minta izin | `call_open` | `call.kind=permission`, `techLine` |
| Pilih opsi | `call_open` | `call.kind=choose`, `options[]` |
| Tanya bebas | `call_open` | `call.kind=ask` |
| Token/biaya | `token_usage` / `cost` | angka stamina & budget |

Envelope:

```json
{ "type": "read", "payload": { "heroId": "sess_…", "path": "src/App.jsx", "op": "read" } }
```

Atau array event dalam satu `POST /v1/events`.

## 4. Keputusan operator → agen

| `decision` | Forward tipikal |
|------------|-----------------|
| `approve` / `deny` | izinkan / tolak tool |
| `reply` / `answer` / `other` | kirim `message` sebagai user reply |
| `option` | pilih `optionId` (atau teks label) |

Jika forward gagal, emit `call_closed` dengan `reason: "failed"` (atau biarkan client dapat notice).

## 5. Keamanan

- Default server: `127.0.0.1` saja.
- Set `DISPATCH_TOKEN` → Bearer wajib untuk **ingest dan decision**.
- Jangan kirim API key / `.env` ke browser atau ke log radio.
- Potong path & `errorShort` sebelum emit.

## 6. Starter di repo

| Path | Isi |
|------|-----|
| `server/fake-agent.js` | End-to-end live tanpa hook proprietary |
| `adapters/README.md` | Indeks adapter |
| `adapters/generic-http/` | Skrip POST event generik |

Adapter Cursor / Claude Code: TBD (lihat roadmap di [`../product/OPEN_SOURCE.md`](../product/OPEN_SOURCE.md)).

## 7. Verifikasi cepat

1. Fake agent muncul sebagai hero (callsign dari hash sesi).
2. `call_open` → panel NELPON MARKAS di UI.
3. Jawab Y → fake agent log `approve` dan lanjut commit/status.
4. Reload UI → snapshot mengembalikan hero (log radio mulai kosong — known limitation).

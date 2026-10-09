# API / event stream contract

| Field | Value |
|-------|-------|
| Status | Draft v1 · 2026-09-29 |
| Transport MVP | SSE `GET /v1/stream` + `POST /v1/calls/{callId}/decision` · atau WS setara |
| Demo | Feeder lokal menghasilkan event JSON yang sama |

## Envelope

```json
{
  "v": 1,
  "id": "evt_…",
  "ts": "2026-09-29T07:00:00.000Z",
  "type": "status",
  "payload": {}
}
```

Semua `type` memakai `payload` sesuai di bawah. Field tak dikenal diabaikan (forward compatible).

## Payload per type

### `hero_upsert`

```json
{
  "hero": {
    "id": "sess_…",
    "sessionId": "sess_…",
    "callsign": "Rex",
    "model": "CL",
    "variant": "Sonnet",
    "status": "idle",
    "loc": "hq",
    "project": "one-bff-go",
    "task": "—",
    "branch": "main",
    "tokensUsed": 8000,
    "tokensMax": 200000,
    "costUsd": 0.01,
    "stats": [0.3, 0.3, 0.2, 0.1, 0.2],
    "files": [],
    "history": [],
    "sidekicks": []
  }
}
```

### `status` / `dispatch`

```json
{ "heroId": "sess_…", "status": "coding", "loc": "coding", "from": "hq", "to": "coding" }
```

`dispatch`: client selalu menganimasikan `from → hq → to` jika `from ≠ to`.

### `read` / `edit`

```json
{ "heroId": "sess_…", "path": "internal/handler/x.go", "op": "read" }
```

### `delegate`

```json
{
  "parentId": "sess_…",
  "sidekick": { "id": "sub_…", "callsign": "Rex-2", "status": "coding", "loc": "coding" },
  "task": "tulis tes"
}
```

### `sidekick_end`

```json
{ "parentId": "sess_…", "sidekickId": "sub_…" }
```

Sidekick dilepas dari induk (tali teal hilang). `sidekickId` tak dikenal diabaikan.

### `commit`

```json
{ "heroId": "sess_…", "sha": "a1b2c3d", "message": "fix middleware" }
```

### `error`

```json
{ "heroId": "sess_…", "errorShort": "go test failed" }
```

### `token_usage` / `cost`

```json
{ "heroId": "sess_…", "tokensUsed": 182000, "tokensMax": 200000 }
```
```json
{ "heroId": "sess_…", "costUsd": 0.42 }
```
```json
{ "shiftCostUsd": 1.56 }
```

### `call_open`

```json
{
  "call": {
    "callId": "call_…",
    "heroId": "sess_…",
    "kind": "permission",
    "quote": "Boss, saya mau jalankan go mod tidy…",
    "quoteSerious": "Byte meminta izin menjalankan go mod tidy.",
    "techLine": "perintah: go mod tidy",
    "options": null,
    "startedAt": "2026-09-29T07:01:00.000Z"
  }
}
```

`choose`: `options: [{ "id": "opt_1", "label": "…" }, …]`  
`ask`: `options` null/omit.

### `call_closed`

```json
{ "callId": "call_…", "reason": "answered" }
```

`reason`: `answered` · `failed` · `stale` · `dismissed`.

Saat `answered`, server menyertakan keputusan agar client bisa memindahkan hero:

```json
{ "callId": "call_…", "reason": "answered", "decision": "option", "optionId": "opt_1", "message": null, "optionLabel": "…" }
```

## Decision (client → server)

`POST /v1/calls/{callId}/decision`

```json
{
  "decision": "approve",
  "optionId": null,
  "message": null
}
```

| `decision` | Wajib |
|------------|-------|
| `approve` / `deny` | — |
| `reply` / `other` / `answer` | `message` non-kosong |
| `option` | `optionId` |

Respons: `202` + nanti `call_closed` di stream. `409` jika call sudah tertutup. `404` unknown.

## Snapshot (opsional)

`GET /v1/snapshot` → `{ heroes, openCalls, lastEventId }` untuk hydrate awal. Client lalu membuka `GET /v1/stream?since={lastEventId}`; saat reconnect, header `Last-Event-ID` menang atas `since`. Server menyimpan buffer 500 event terakhir untuk replay.

## Ingest (sumber → server)

`POST /v1/events` dengan body `{ "type", "payload" }` atau array-nya (maks 64 KB). Server memberi `id`/`ts` lalu fan-out ke stream. `Authorization: Bearer {DISPATCH_TOKEN}` wajib jika env `DISPATCH_TOKEN` diset. Respons `202 { ids }` · `400` jika bentuk event salah.

## Status call (server → sumber)

`GET /v1/calls/{callId}` → `{ "state": "ringing" | "answered" | …, "decision": { "decision", "optionId", "message" } | null }`. Adapter sumber polling endpoint ini untuk meneruskan keputusan ke agen.

## Error stream

```json
{ "v": 1, "id": "evt_…", "ts": "…", "type": "server_notice", "payload": { "level": "warn", "text": "…" } }
```

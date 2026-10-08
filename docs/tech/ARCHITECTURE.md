# Architecture — AI Dispatch

| Field | Value |
|-------|-------|
| Status | Draft v1 · 2026-09-29 |
| Fase | Mockup → app nyata |

## 1. Ringkas

```text
[Agent sources] → [Adapter / Ingest] → [Event bus / API] → [Web client]
                                      ↑
                               [Operator decisions]
```

- **Client**: SPA (target React + Vite) merender peta SVG, roster, call, log.
- **Ingest**: menormalisasi event dari sumber agen ke skema [`API.md`](./API.md).
- **MVP jalur A**: client + **demo feeder** in-browser (tanpa backend).
- **MVP jalur B**: small backend (Go/Node) SSE/WebSocket + POST decision.

## 2. Keputusan (ADR singkat)

| ID | Keputusan | Alasan |
|----|-----------|--------|
| ADR-1 | Kode menang atas dokumen visual setelah impl | Hindari drift design-style |
| ADR-2 | Event-sourced UI state | Cocok radio log + travel + call |
| ADR-3 | SSE atau WS untuk feed; REST/POST untuk decision | Satu arah stream + ack keputusan |
| ADR-4 | Demo mode wajib | Honest demo offline / CI |
| ADR-5 | Map logic di client dulu | Proyeksi & pathfinding sudah di mockup |

## 3. Layer client

| Layer | Tanggung jawab |
|-------|----------------|
| `ui/` | Komponen presentasi (Header, Roster, Call, Detail, RadioLog, Map) |
| `state/` | Store world: heroes, calls, log, prefs |
| `map/` | Proyeksi, graph jalan, Dijkstra, travel tween |
| `copy/` | Template komedi/serius |
| `ingest/` | Apply event → state; kirim decision |

## 4. Backend (jika ada)

| Modul | Tanggung jawab |
|-------|----------------|
| `ingest` | Adapter sumber → event normal |
| `store` | Snapshot heroes + buffer event (memory/Redis OK MVP) |
| `stream` | Fan-out ke client |
| `decision` | Validasi callId + forward ke adapter sumber |

Persistensi jangka panjang **bukan** blocker MVP.

## 5. Non-tujuan arsitektur MVP

Auth multi-user kompleks · horizontal scale multi-region · message queue berat · DB schema final.

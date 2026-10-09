# Architecture — AI Dispatch

| Field | Value |
|-------|-------|
| Status | Draft v2 · 2026-10-09 |
| Fase | Mockup → app nyata → distribusi OSS |
| OSS | [`../product/OPEN_SOURCE.md`](../product/OPEN_SOURCE.md) |

## 1. Ringkas

```text
[Agent sources] → [Adapter / Ingest] → [Event bus / API] → [Web client]
                                      ↑
                               [Operator decisions]
```

Distribusi open source memakai **tiga lapisan** (core wajib; server & adapter opsional) — detail di OPEN_SOURCE.md.

- **Client**: SPA (React + Vite) merender peta SVG, roster, call, log.
- **Ingest**: menormalisasi event dari sumber agen ke skema [`API.md`](./API.md).
- **MVP jalur A (default OSS)**: client + **demo feeder** in-browser (tanpa backend).
- **MVP jalur B (opsional)**: small backend (Node) SSE + POST decision.

## 2. Keputusan (ADR singkat)

| ID | Keputusan | Alasan |
|----|-----------|--------|
| ADR-1 | Kode menang atas dokumen visual setelah impl | Hindari drift design-style |
| ADR-2 | Event-sourced UI state | Cocok radio log + travel + call |
| ADR-3 | SSE atau WS untuk feed; REST/POST untuk decision | Satu arah stream + ack keputusan |
| ADR-4 | Demo mode wajib | Honest demo offline / CI / first-run OSS |
| ADR-6 | Core tanpa wajib adapter | Install-and-use; agen lokal = add-on |
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

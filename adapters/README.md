# Adapters

Layer 3 open source: jembatan dari **sumber agen** ke event AI Dispatch.

Core UI **tidak** bergantung folder ini. Lihat [`docs/tech/CONNECT_AGENT.md`](../docs/tech/CONNECT_AGENT.md).

## Yang ada

| Adapter | Status | Path |
|---------|--------|------|
| Demo (in-browser) | Stabil | `src/demoFeed.js` (bukan folder ini) |
| Fake agent | Contoh live | `../server/fake-agent.js` — `npm run agent:fake` |
| Generic HTTP | Starter | [`generic-http/`](./generic-http/) |
| Cursor | Planned | — |
| Claude Code | Planned | — |

## Kontrak

1. Identify sesi → `heroId` / `sessionId` stabil.
2. Map status sumber → `coding|reading|talking|waiting|idle|attention`.
3. `POST /v1/events` dengan body `{ type, payload }` (atau array).
4. Forward keputusan dari `GET /v1/calls/{callId}` ke mekanisme asli agen.
5. Jangan hardcode copy UI; biarkan client yang bungkus komedi/serius.

Wire format: [`docs/tech/API.md`](../docs/tech/API.md).

# Adapters

Layer 3 open source: jembatan dari **sumber agen** ke event AI Dispatch.

Core UI **tidak** bergantung folder ini. Lihat [`docs/tech/CONNECT_AGENT.md`](../docs/tech/CONNECT_AGENT.md).

## Yang ada

| Adapter | Status | Path |
|---------|--------|------|
| Demo (in-browser) | Stabil | `src/demoFeed.js` (bukan folder ini) |
| Fake agent | Contoh live | `../server/fake-agent.js` — `npm run agent:fake` |
| Generic HTTP | Starter | [`generic-http/`](./generic-http/) |
| Cursor | Starter | [`cursor/`](./cursor/) |
| Claude Code | Starter | [`claude-code/`](./claude-code/) |
| Shared client | — | [`lib/dispatch.mjs`](./lib/dispatch.mjs) |

## Kontrak

1. Identify sesi → `heroId` / `sessionId` stabil.
2. Map status sumber → `coding|reading|talking|waiting|idle|attention`.
3. `POST /v1/events` dengan body `{ type, payload }` (atau array).
4. Forward keputusan dari `GET /v1/calls/{callId}` ke mekanisme asli agen.
5. Jangan hardcode copy UI; biarkan client yang bungkus komedi/serius.

Wire format: [`docs/tech/API.md`](../docs/tech/API.md).

## Env bersama

| Var | Default | Arti |
|-----|---------|------|
| `DISPATCH_URL` | `http://127.0.0.1:8787` | Base server |
| `DISPATCH_TOKEN` | (kosong) | Bearer untuk ingest (dan decision UI via `VITE_DISPATCH_TOKEN`) |
| `DISPATCH_GATE` | off | `1` = shell/Bash menunggu Y/N di markas |
| `DISPATCH_GATE_TIMEOUT_MS` | `300000` | Timeout poll keputusan |

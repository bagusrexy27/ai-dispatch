# Cursor adapter

Hook stdin → event AI Dispatch. Observe by default; set `DISPATCH_GATE=1` to route shell commands through markas.

## Setup

1. `npm run server` + `npm run dev:live`.
2. Merge [`hooks.json.example`](./hooks.json.example) ke `.cursor/hooks.json` **di project yang ingin dipantau** (bukan wajib di repo Dispatch sendiri).

   Path `command` relatif ke root project itu. Opsi mudah: clone/symlink script, atau pakai path absolut:

   ```json
   { "command": "node \"D:/Code/ai-dispatch/adapters/cursor/hook.mjs\"" }
   ```

3. Env (user / system / shell yang menjalankan Cursor):

| Var | Arti |
|-----|------|
| `DISPATCH_URL` | default `http://127.0.0.1:8787` |
| `DISPATCH_TOKEN` | Bearer jika server pakai token |
| `DISPATCH_GATE` | `1` = shell menunggu Y/N di markas |
| `DISPATCH_GATE_TIMEOUT_MS` | default `300000` |

4. Restart Cursor / cek Hooks output channel.

> `beforeShellExecution` timeout di `hooks.json` harus ≥ waktu tunggu operator (contoh `300` detik) kalau `DISPATCH_GATE=1`.

## Mapping

| Hook Cursor | Event Dispatch |
|-------------|----------------|
| `sessionStart` | `hero_upsert` |
| `sessionEnd` | `session_end` |
| `beforeReadFile` | `read` |
| `afterFileEdit` | `edit` |
| `beforeShellExecution` + gate | `call_open` → poll → `{ permission }` |
| `stop` | `status` idle/attention |

`heroId` = hash stabil dari `conversation_id`.

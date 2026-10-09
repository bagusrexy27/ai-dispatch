# Claude Code adapter

Hook stdin → event AI Dispatch. Observe by default; set `DISPATCH_GATE=1` to route Bash through markas (Y/N).

## Setup

1. `npm run server` + `npm run dev:live` di repo AI Dispatch.
2. Salin [`settings.example.json`](./settings.example.json) ke `~/.claude/settings.json` atau `.claude/settings.json` di project target.
3. Ganti `/ABS/PATH/TO/ai-dispatch` dengan path absolut ke clone ini.
4. (Opsional) di environment shell yang menjalankan Claude Code:

```bash
export DISPATCH_URL=http://127.0.0.1:8787
export DISPATCH_TOKEN=   # sama dengan server jika dipakai
export DISPATCH_GATE=1   # Bash → panggilan markas
```

5. Di Claude Code: `/hooks` untuk verifikasi.

## Mapping

| Hook Claude Code | Event Dispatch |
|------------------|----------------|
| `SessionStart` | `hero_upsert` |
| `SessionEnd` | `session_end` |
| `PostToolUse` Read/Glob/Grep | `read` + status `reading` |
| `PostToolUse` Edit/Write | `edit` + status `coding` |
| `PreToolUse` Bash + `DISPATCH_GATE=1` | `call_open` → poll → `permissionDecision` |

`heroId` = hash stabil dari `session_id`.

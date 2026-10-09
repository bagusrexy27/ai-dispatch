# Generic HTTP adapter (starter)

Mengirim event sudah-normal ke server Dispatch. Cocok untuk webhook, script lokal, atau prototipe sebelum hook Cursor/Claude Code.

## Jalankan

```bash
# terminal 1
npm run server

# terminal 2 — hero muncul di markas
node adapters/generic-http/emit.mjs upsert

# baca file → status reading
node adapters/generic-http/emit.mjs read internal/handler.go

# buka panggilan permission
node adapters/generic-http/emit.mjs call
```

Env:

| Var | Default |
|-----|---------|
| `DISPATCH_URL` | `http://127.0.0.1:8787` |
| `DISPATCH_TOKEN` | (kosong) |
| `HERO_ID` | `sess_generic_demo` |

UI: `npm run dev:live`, lalu refresh.

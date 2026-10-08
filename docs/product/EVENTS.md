# Event catalog — AI Dispatch (product)

| Field | Value |
|-------|-------|
| Status | Draft v1 · 2026-09-29 |
| Wire format | [`../tech/API.md`](../tech/API.md) |

Setiap event punya fakta wajib. Copy komedi hanya membungkus fakta; mode serius memakai template lugas (lihat design-style §9).

## Event → UI

| Event `type` | Fakta wajib | Efek UI |
|--------------|-------------|---------|
| `session_start` | hero id, model, session | Hero muncul di HQ / idle |
| `session_end` | hero id | Hilang dari roster atau idle |
| `status` | hero, status baru | Pindah gedung (dispatch travel) atau update label |
| `dispatch` | hero, from, to | Travel via HQ + jejak + log |
| `read` | hero, file | Log; status sering `reading` |
| `edit` / `write` | hero, file | Log; status sering `coding` |
| `delegate` | parent, child, task | Sidekick + tali teal + log |
| `commit` | hero, sha, message | Stempel BERES! + paket ke Dermaga |
| `error` | hero, error_short | Stempel WADUH + log oranye |
| `token_usage` | hero, used, max | Stamina bar |
| `cost` | hero atau shift, usd | Budget header/detail |
| `call_open` | call (kind, quote, tech, options?) | Attention + panel + dering |
| `call_result` | callId, decision outcome | Stempel DIJAWAB / SUDAH LEWAT; tutup panel |
| `radio` | peer ids (opsional) | Garis gelombang antar hero di Menara Radio |

## Incoming call (aturan product)

| `kind` | Operator | Setelah jawab |
|--------|----------|---------------|
| `permission` | approve / deny / reply(+teks) | deny → standby; selain itu → mission |
| `choose` | optionId atau other(+teks) | lanjut mission |
| `ask` | answer(+teks wajib) | lanjut mission |

- Kutipan boleh komedi; baris teknis & label opsi = teks asli agen.
- Persetujuan tidak pernah otomatis.

## Prioritas render

1. Call ringing (merah, suara)
2. Travel / stempel
3. Radio log append
4. Idle ambient motion

## Out of scope event (MVP)

Chat thread multi-turn di panel call · event editor arbitrary · metrics bisnis di luar budget/token.

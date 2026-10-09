# Contributing to AI Dispatch

Terima kasih mau ikut bangun markas. Produk ini open source (MIT) — fokusnya **install → langsung kepakai** (demo), lalu opsional live agent.

Baca dulu: [`docs/product/OPEN_SOURCE.md`](docs/product/OPEN_SOURCE.md).

## Setup

Butuh **Node.js 20+** (disarankan LTS).

```bash
npm install
npm run dev      # demo — jalur utama
npm test
npm run lint
npm run build
```

Live (opsional):

```bash
npm run server
npm run dev:live
npm run agent:fake
```

Detail: [`docs/tech/SETUP.md`](docs/tech/SETUP.md).

## Apa yang dikerjakan di mana

| Area | Folder | Catatan |
|------|--------|---------|
| UI / demo | `src/` | Default path pengguna baru |
| Server SSE | `server/` | Tanpa dependency npm |
| Kontrak event | `docs/tech/API.md` | Ubah docs + tes jika ubah wire format |
| Adapter sumber | `adapters/` (starter) atau repo terpisah | Jangan hardcode di core UI; lihat `docs/tech/CONNECT_AGENT.md` |

## Gaya perubahan

- Conventional commits: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.
- PR kecil dan fokus.
- UI mengikuti mockup/visual di `mockup.html` + `design-style.md` bila relevan.
- Event UI state hanya lewat `applyEvent` (`src/world.js`).
- Copy komedi boleh; fakta (path, error, tech line) harus jujur dari event.

## Tes

```bash
npm test          # reducer, translate, server HTTP
npm run lint
npm run build
```

Untuk perubahan server/event: tambah atau sesuaikan tes di `test/`.

## Pull request

1. Fork / branch dari `main`.
2. Satu tujuan per PR.
3. Deskripsi: apa yang berubah + cara menguji (checklist singkat).
4. Jangan commit `.env`, secret, atau artefak lokal.

## Keamanan

- Jangan expose server ke jaringan tanpa token (`DISPATCH_TOKEN`).
- Adapter tidak boleh mengirim secret ke browser.
- Laporkan isu keamanan secara pribadi ke maintainer bila memungkinkan (jangan dump credential di issue publik).

# Frontend architecture

| Field | Value |
|-------|-------|
| Status | Draft v1 · 2026-09-29 |
| Target | React + Vite + TypeScript |
| Token CSS | `src/styles/tokens.css` (sumber nilai setelah impl) |
| Status/copy | `src/lib/status.ts`, `src/lib/copy.ts` |
| Model badge | `src/lib/models.ts` |

## Folder (usulan)

```text
src/
  styles/tokens.css
  lib/status.ts
  lib/models.ts
  lib/copy.ts
  lib/callsign.ts
  state/worldStore.ts
  ingest/applyEvent.ts
  ingest/demoFeeder.ts
  map/project.ts
  map/graph.ts
  map/path.ts
  map/travel.ts
  components/
    Header.tsx
    RadioLog.tsx
    IncomingCall.tsx
    HeroDetail.tsx
    Roster.tsx
    HeroCard.tsx
    MapView.tsx
    MapHero.tsx
    Landmark.tsx
    Stamp.tsx
    …
  App.tsx
  main.tsx
```

## State

Satu store `World`:

- `heroes: Map<id, Hero>`
- `calls: IncomingCall[]` (maks 3 terlihat; sisanya `+N`)
- `log: LogEntry[]` (cap ~200)
- `shift: { clock, budget, serious, sfx, music }`
- `selectedHeroId`

Update **hanya** lewat `applyEvent` / aksi UI (select, prefs, submitDecision).

## Komponen ↔ domain

Sesuai design-style §3. Incoming call = satu-satunya tempat operator mengubah jalan agen.

## Map module

| Modul | Isi |
|-------|-----|
| `project` | θ = −16°, flatten 0.56, world→screen |
| `graph` | grid jalan + driveway gedung |
| `path` | Dijkstra; rute selalu via HQ |
| `travel` | tween sepanjang polyline; update `traveling` |

Detail geometri: design-style §3.1 — **jangan duplikasi panjang di sini**; update design-style jika rumus berubah di kode.

## Interaksi

| Input | Aksi |
|-------|------|
| `1`–`9` | pilih hero roster |
| `Space` | fokus panel call |
| `Y`/`N`/`R` | permission (saat call fokus) |
| `1`–`9` | pilih opsi choose |
| Ctrl+Enter | kirim teks ask/reply |
| `Esc` | tutup detail |

## Responsive

- ≤900px: radio log drawer; call floating; detail sheet bawah
- ≤600px: label gedung ikon+count; roster scroll horizontal

## Kualitas

- Ikon SVG stroke, bukan emoji
- Warna bukan satu-satunya sinyal status
- `prefers-reduced-motion`: matikan ambient/travel panjang, keep call alert jelas

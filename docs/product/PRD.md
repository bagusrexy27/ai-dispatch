# PRD — AI Dispatch

| Field | Value |
|-------|-------|
| Status | Draft v1 · 2026-09-29 |
| Scope | Web app pemantau agen AI coding; operator = dispatcher, agen = hero |
| Sumber visual | [`design-style.md`](../../design-style.md), [`mockup.html`](../../mockup.html) |

## 0. Hubungan dengan AI Colony Monitor

**Tujuan produk sama** dengan AI Colony Monitor: pantau agen AI coding secara live, baca status sekilas, dan jawab saat agen butuh operator.

Yang diganti hanya **konsep/kulit**:

| | AI Colony | AI Dispatch |
|---|-----------|-------------|
| Metafora | Koloni luar angkasa | Kantor hero ala game *Dispatch* |
| Presence | Bay / habitat | Peta kota wireframe + gedung kerja |
| Agen | Colonist / unit | Hero + callsign |
| Perhatian operator | Alert koloni | Incoming call (nelpon markas) |

Bukan produk dengan job berbeda — re-skin + re-frame UX dari Colony.

## 1. Masalah

Operator yang menjalankan banyak agen coding sulit melihat *siapa sedang apa*, *di repo mana*, dan *kapan butuh keputusan manusia* tanpa membuka banyak terminal/chat. Dashboard tabular terasa dingin dan lambat dibaca sekilas.

## 2. Solusi

Satu komposisi layar bergaya game Dispatch: peta kota wireframe (presence), roster hero, radio log, dan panel **incoming call** saat agen butuh operator. Fakta tetap jujur dari event nyata (prinsip Colony tetap).

## 3. Pengguna

| Persona | Kebutuhan |
|---------|-----------|
| Operator / dispatcher lokal | Pantau agen, jawab izin/pilihan/tanya, sekilas status tanpa klik |

## 4. Prinsip

- **Presence over tables** — peta + roster, bukan grid statistik.
- **One composition** — peta full-bleed, UI di tepi.
- **Honest demo** — setiap kalimat UI berasal dari event/data nyata; lelucon hanya bingkai.
- **Operator wajib untuk keputusan** — tidak ada auto-approve / auto-pilih.

## 5. Goals (MVP)

1. Tampilkan hero live (atau demo feed) di peta + roster dengan status & lokasi.
2. Radio log dari event agen (read/edit/dispatch/commit/error/call).
3. Incoming call tiga jenis: `permission` · `choose` · `ask`, dengan jawaban operator yang dikirim balik ke sumber.
4. Mode serius (copy lugas) + SFX opsional.
5. Detail hero: tugas, repo/branch, stamina token, budget, radar profil kerja.

## 6. Non-goals (MVP)

- Multi-tenant SaaS / billing.
- Edit kode dari UI Dispatch.
- Pan/zoom kamera peta atau kamera ikut hero.
- Autopilot keputusan call.
- Membawa kembali aset/tema visual koloni luar angkasa (metafora itu sudah diganti).

## 7. Sukses

| Metrik | Target kasar |
|--------|----------------|
| Time-to-understand status hero | ≤3 detik tanpa klik |
| Time-to-answer call | ≤2 klik / shortcut Y·N·R·1–9 |
| Demo bisa jalan offline | Fake feed tanpa backend live |

## 8. Referensi

- Domain: [`DOMAIN.md`](./DOMAIN.md)
- Event product: [`EVENTS.md`](./EVENTS.md)
- Kontrak teknis: [`../tech/API.md`](../tech/API.md)

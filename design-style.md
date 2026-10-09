# Design style — AI Dispatch

| Field | Value |
|-------|-------|
| Status | **Usulan v3** 2026-09-28. Menggantikan seluruh tema koloni (v1/v2) |
| Scope | Web app pemantau agen AI: peta kota wireframe isometrik, strip portrait hero, radio log, incoming call dengan respons operator |
| Mockup | [`mockup.html`](./mockup.html): satu layar statis, buka langsung di browser |
| Sumber nilai | Setelah diimplementasi, **kode menang**. Target file: `src/styles/tokens.css` (token), `src/lib/status.ts` (status + copy), `src/lib/models.ts` (badge model). Ubah kode → update dokumen ini di sesi yang sama |
| Referensi rasa | *Dispatch* (AdHoc Studio, 2025). Dari review: peta kota **wireframe** dilihat miring dari atas, portrait hero berjajar di bawah dengan meter kesiapan, marker panggilan berdenyut di atas lokasi dengan meter progres, marker berkedip merah saat dispatcher perlu memutuskan, hero pulang ke HQ, dan grafik radar segi lima untuk kemampuan. **Hanya rasa & alur**; nama, aset, font, karakter tidak dipakai |

---

## 1. Arah

**Operator adalah dispatcher di kantor hero yang agak kacau.** Agen AI adalah hero dengan callsign. Tugas mereka muncul sebagai panggilan di peta kota. Sesekali hero menelepon markas untuk minta keputusan, dan di situ operator benar-benar bertindak.

| Kata kunci | Artinya |
|------------|---------|
| Game, bukan dashboard | Marker, portrait, stempel, suara radio. Tidak ada tabel dan tidak ada grid kartu statistik |
| Peta taktis wireframe | Kota realistis dari garis: gedung bertingkat dengan garis lantai dan jendela menyala, di atas latar gelap. Warna hanya muncul di gedung kerja, marker, dan hero |
| UI komik di tepi | Panel, kartu, dan tombol memakai outline tinta, bayangan keras, dan halftone. Petanya sendiri tetap bersih tanpa outline komik |
| Lucu tapi jujur | Nada kantor komedi, tapi setiap kalimat berasal dari event nyata. Lelucon tidak boleh menutupi fakta |
| Tenang sampai ada panggilan | Peta bergerak pelan terus-menerus. Merah dan dering hanya untuk incoming call |
| Terbaca sekilas | Tiap hero sedang apa terbaca dari roster, tanpa klik |

Prinsip PRD tetap: **presence over tables** · **one composition** (peta full-bleed, UI di tepi) · **honest demo**.

---

## 2. Tata letak

```text
┌──────────────────────────────────────────────────────────────────────┐
│ HEADER 56px: brand · jam · budget · hero aktif · !! panggilan · suara │
├────────────────┬───────────────────────────────────────┬─────────────┤
│ INCOMING CALL  │                                       │ DETAIL HERO │
│ (hanya saat    │     PETA KOTA UTUH (statis, fit)       │ 360px       │
│  ada panggilan)│   HQ di tengah · gedung per pekerjaan  │ slide-in    │
├────────────────┤   hero berangkat dari HQ lewat jalan   │ saat dipilih│
│ RADIO LOG      │                                       │             │
│ 320px          │                                       │             │
├────────────────┴───────────────────────────────────────┴─────────────┤
│ ROSTER 160px: kartu hero (urut: panggilan → misi → standby → markas)  │
└──────────────────────────────────────────────────────────────────────┘
```

- **Peta selalu penuh**: `viewBox` berpusat di HQ dan mengikuti rasio panel (`xMidYMid slice`), dan semua gedung kerja selalu terlihat. Operator tidak perlu geser atau zoom, jadi tidak ada pan, zoom, atau kamera yang ikut hero.
- Panel samping memakai latar opak dengan outline tinta, bukan kaca blur.
- Incoming call **tidak** berupa modal. Panel masuk ke kolom kiri di atas radio log (radio log menyusut), jadi tidak menutupi peta. Beberapa panggilan menumpuk (maks 3 terlihat, sisanya ditulis "+N lagi").
- **≤900px:** radio log disembunyikan (jadi drawer lewat tombol di header), incoming call menjadi panel melayang di atas roster, dan detail hero menjadi sheet dari bawah.
- **≤600px:** peta tetap utuh tapi label gedung hanya menampilkan ikon + jumlah hero, dan roster bisa di-scroll horizontal.

---

## 3. Pemetaan data → game

| Di sistem | Di layar | Komponen |
|-----------|----------|----------|
| Agen | **Hero**: token bulat berisi badge model + callsign | `HeroCard`, `MapHero` |
| Subagent | **Sidekick**: token lebih kecil, punya status dan lokasi sendiri, dan terhubung ke induk dengan tali putus-putus teal | `SidekickChip`, `MapHero` |
| Jenis pekerjaan (status) | **Gedung** di peta (§3.1) | `Landmark` |
| Agen idle / sesi baru | **HQ**: hub di tengah peta, tempat semua hero mulai dan pulang | `HQ` |
| Status berubah | **Dispatch**: hero jalan dari gedung lama → HQ → gedung baru, dengan jejak rute berwarna gedung tujuan | `MapHero`, `Trail` |
| Project/repo | **Tag** di kartu roster, detail, dan panel panggilan. Bukan tempat di peta | `HeroCard` |
| Tugas aktif | Judul tugas di kartu roster dan detail | `HeroCard` |
| Delegasi agen → subagent | Sidekick diberangkatkan dari HQ + tali teal ke induk | `LinkDeleg` |
| Commit | Stempel **"BERES!"** di hero, lalu **paket** berjalan lewat jalan ke Dermaga Kirim dan atap dermaga menyala hijau | `Stamp`, `Package` |
| Error | Stempel **"WADUH"** oranye di hero, entri log oranye | `Stamp` |
| Butuh operator | **Incoming call**: kartu hero bergetar, dering, panel keputusan | `IncomingCall` |
| Token terpakai (dari konteks) | **Stamina bar** | `StaminaBar` |
| Biaya | **Budget** di header; per hero di detail | `Budget` |
| Feed event | **Radio log** | `RadioLog` |

Callsign dipilih secara deterministik dari hash session id memakai daftar kata tetap (`Rex`, `Nova`, `Bolt`, `Ivy`, `Mochi`, …). Id asli tetap tampil di detail, dan callsign yang sama selalu berarti sesi yang sama.

### 3.1 Peta kota

**Proyeksi**: tampak miring, seperti kamera drone. Tanah diputar −16° lalu dipipihkan 0.56: `sx = 11·(cos θ·x − sin θ·y)` dan `sy = 11·0.56·(sin θ·x + cos θ·y) − 10·z`, dengan θ = −16°. HQ ada di (0,0). Lapisan tanah (laut, jalan, kavling, pohon) digambar dalam koordinat dunia lewat satu `transform="matrix(…)"`, sedangkan gedung digambar sebagai prisma di koordinat layar dan diurutkan dari belakang ke depan.

**Peta selalu penuh**: `viewBox` berpusat di HQ dengan lebar dunia 1000–1150 (mengikuti lebar panel), sedangkan tingginya mengikuti rasio panel (`ResizeObserver`), memakai `preserveAspectRatio="xMidYMid slice"`. Kota selalu digenerate lebih luas dari layar, jadi sudut layar tidak pernah kosong.

**Jalan: lurus dan rapi, belokannya halus.** Jalan berupa grid tegak lurus dengan jarak 16 unit, ditambah satu jalan pantai. Aturannya:

- **Setiap persimpangan 90°**, berbentuk T atau +. Tidak ada pertigaan lancip atau perempatan miring.
- **Belokan = kurva S** (Bezier kubik yang tangen di kedua ujungnya searah sumbu jalan). Jadi jalan bisa bergeser beberapa unit di tengah blok tanpa mengubah sudut persimpangan. Contohnya avenue x=24 yang bergeser 6 unit ke timur di selatan HQ, dan jalan y=40 yang turun 4 unit di timur.
- **Jalan pantai** mengikuti garis pantai dengan kurva halus (Catmull-Rom). Pantainya hampir lurus, jadi jalan yang bertemu dengannya tetap mendekati tegak lurus.
- Beberapa ruas dihilangkan untuk membentuk blok besar (stadion, kampus, taman) sehingga muncul pertigaan T. Tidak ada jalan buntu yang terlihat.
- Rel kereta lurus sejajar grid dan memotong avenue tegak lurus.

| Kelas | Lebar | Isi | Marka |
|-------|-------|-----|-------|
| Arteri | 1.4 | jalan depan HQ (y=8), avenue x=8, jalan pantai | tengah kuning putus-putus |
| Lokal | 1.05 | sisa grid | — |

Semua jalan memakai tepi `#4d77a0`, aspal `--road`, dan lampu jalan. Setiap gedung kerja punya jalan masuk (driveway) lurus yang menempel tegak lurus ke jalan terdekat.

**District** (14 district, ditentukan dengan Voronoi berbobot) hanya menentukan **gaya isi kavling**. Kavling selalu mengikuti blok grid: tiap blok dibagi rata sesuai ukuran kavling gayanya, dengan gang di antaranya.

| District | Gaya | Isi |
|----------|------|-----|
| Pusat Kota | downtown | 1–4 gedung per blok, makin tinggi mendekati HQ (sampai ~8 unit), garis lantai + jendela menyala |
| Pelabuhan | port | deretan peti kemas, gudang, 3 dermaga kayu, 2 kapal |
| Kota Tua, Terminal | old | gedung kecil dengan lebar dan kedalaman tidak rata |
| Kawasan Industri, Stasiun | ind | gudang panjang, tangki bundar |
| Stadion | civic | stadion elips dengan lapangan dan 4 tiang lampu, taman |
| Kampus | campus | halaman rumput, gedung bentuk U, kubah bertingkat |
| Taman Kota | park | danau, pohon, paviliun |
| Bukit Antena, Perumahan Selatan/Timur/Barat | resid | rumah kecil 2 baris per blok, sesekali taman |

- **Laut** ada di sisi barat (kiri layar) dengan garis pantai yang melengkung landai, garis air dangkal putus-putus, ombak, 3 dermaga kayu, dan kapal. **Rel kereta** di utara lengkap dengan bantalan dan stasiun.
- Kavling tidak boleh menimpa jalan, rel, laut, atau zona gedung kerja/landmark. Blok yang bertabrakan dipecah sampai 3 tingkat supaya celah tetap terisi.
- **Tidak ada label nama district atau laut** di peta. Nama district hanya dipakai di spesifikasi ini. Teks di peta hanya plang marker gedung kerja, supaya perhatian operator tertuju ke tempat hero bekerja.
- Semua dekorasi deterministik (seed tetap) dan tidak bisa diklik. Elemen di luar area pandang tidak digambar.

**Gedung kerja** ditaruh manual di district masing-masing. Gedungnya sama-sama wireframe, tapi garis dan isinya berwarna lokasi (sisi 10–18%, atap 30%):

| Gedung | Status | District | Bentuk | Warna |
|--------|--------|----------|--------|-------|
| **HQ** (hub dispatch) | idle, dan titik transit semua perjalanan | Pusat Kota | podium + menara 6.5 | `--accent` |
| **Bengkel Kode** | coding | Kawasan Industri | gudang dengan atap gergaji | `--st-mission` |
| **Menara Radio** | talking | Bukit Antena | menara ramping 6 + antena dengan beacon | `--st-radio` |
| **Perpustakaan** | reading | Kampus | gedung 2.2 + portico | `--st-investigate` |
| **Ruang Tunggu** | waiting | Terminal | gedung rendah + kanopi | `--st-standby` |
| **Dermaga Kirim** | tujuan paket commit (bukan tempat hero) | Pelabuhan | gudang + crane di dermaga | `--ok` |

**Marker lokasi**, seperti marker panggilan di *Dispatch*: lingkaran ikon r16 melayang ±54px di atas atap, disambung garis putus-putus ke atap. Di sebelah kanan ada plang nama dengan strip warna, jenis kerja, dan jumlah hero ("coding · 3 hero"). Saat ada hero attention di sana, marker berubah merah dengan ikon telepon dan ring berdenyut.

Aturan:

- Semua perjalanan **lewat HQ** (hub-and-spoke) dan mengikuti jalan: rute = jalur terpendek (Dijkstra) dari gedung asal ke HQ, lalu dari HQ ke gedung tujuan. Hero tidak memotong lahan langsung antar gedung.
- Hero yang sudah sampai **berjajar di atas marker** (maks 5 per baris, berikutnya baris kedua).
- Attention **tidak** memindahkan hero.

---

## 4. Status hero (encoding)

Status dibaca dari **4 kanal**: posisi di peta, ikon, label teks, dan warna. Warna tidak pernah jadi satu-satunya sinyal.

| Status agen | Label game | Posisi di peta | Ikon | Warna | Kartu roster |
|-------------|-----------|----------------|------|-------|--------------|
| coding | ON MISSION | Bengkel Kode | ⚒ palu | `--st-mission` kuning | ring progres berputar di token |
| reading | MENYELIDIKI | Perpustakaan | 🔍 lup | `--st-investigate` teal | ikon lup |
| talking | DI RADIO | Menara Radio + garis gelombang ke lawan bicara | 📻 gelombang | `--st-radio` biru muda | ikon gelombang |
| waiting | STANDBY | Ruang Tunggu | ⏸ jam | `--st-standby` abu biru | kartu sedikit redup |
| idle | DI MARKAS | HQ | ☕ cangkir | `--st-idle` abu gelap | kartu di ujung roster, redup 60% |
| attention | **NELPON MARKAS** | tetap di gedungnya + ring merah berdenyut | ☎ telepon | `--alert` merah | kartu naik 8px, bergetar sekali, badge `!!` |
| (transisi) | MENUJU {gedung} | di jalan, dengan jejak rute | — | warna gedung tujuan | label status "Menuju …" |

Ikon di atas hanya penanda di dokumen. Di implementasi, ikon digambar sebagai SVG inline sendiri dengan stroke 2px dan outline tinta, **bukan emoji**.

---

## 5. Warna

### 5.1 Token dasar

| Token | Nilai | Pakai untuk |
|-------|-------|-------------|
| `--bg` | `#070b14` | Latar halaman |
| `--ground` | `#070c17` | Tanah peta |
| `--road` | `#17243e` | Aspal (harus jelas lebih terang dari tanah) |
| tepi jalan / marka tengah | `#4d77a0` / `#e0bb62` 60% putus-putus | Garis jalan |
| taman / pohon | `#0b1e1a` / `#12332b` garis `#3a8a6c` | Taman, halaman kampus, lapangan stadion |
| `--water` | `#081a33` | Laut |
| `--wire` | `#4f7396` | Garis wireframe gedung, jalan, grid radar |
| `--wire-hi` | `#a9cbe6` | Tepi atap gedung |
| `--bld-top` / `--bld-x` / `--bld-y` | `#101a30` / `#0c1528` / `#09101f` | Isi atap / sisi kanan / sisi kiri gedung (shading) |
| Jendela menyala | `#ffd58a` opacity .55 | Aksen hidup kota malam (dekorasi, bukan sinyal) |
| Taman | isi `#0b1e1a`, garis `#2c6b55` | Taman dan pohon |
| `--panel` | `#111829` | Panel, kartu |
| `--panel-2` | `#1a2338` | Kartu hover, isi input |
| `--ink` | `#03050a` | Outline tinta, bayangan keras |
| `--text` | `#eef2f7` | Teks utama |
| `--muted` | `#8d9ab0` | Jam, label, meta |
| `--accent` | `#ffc53d` | Aksi, aktif, tombol utama, atap HQ |
| `--info` | `#3ec6c1` | Delegasi, link, info sistem |
| `--ok` | `#7ed957` | Sukses, terhubung, "BERES!" |
| `--fail` | `#f08a4b` | Error biasa, "WADUH" |
| `--alert` | `#ff3b4a` | **Hanya** incoming call |

### 5.2 Status

| Token | Nilai |
|-------|-------|
| `--st-mission` | `#ffc53d` |
| `--st-investigate` | `#3ec6c1` |
| `--st-radio` | `#8ecbff` |
| `--st-standby` | `#9aa4bd` |
| `--st-idle` | `#5d6781` |

### 5.3 Badge model

Badge berbentuk **lettermark** (2 huruf, kotak bersudut 4px, outline tinta), bukan logo resmi vendor. Warnanya dari palet sendiri, bukan warna brand.

| Model family | Lettermark | Latar | Teks |
|--------------|-----------|-------|------|
| Claude | `CL` | `#e9a36b` | `--ink` |
| GPT | `GP` | `#9be3c7` | `--ink` |
| Gemini | `GM` | `#a9b8ff` | `--ink` |
| Grok | `GK` | `#d6d6d6` | `--ink` |
| Lainnya / tak dikenal | 2 huruf pertama nama model | `#c9c3b3` | `--ink` |

Varian model (Opus/Sonnet, dan sejenisnya) ditulis sebagai teks kecil di bawah badge, bukan dengan warna berbeda.

### 5.4 Aturan

1. **Merah = incoming call saja.** Hapus, error, dan dekorasi tidak boleh merah.
2. Kuning = aksi/misi, teal = info/delegasi, hijau = sukses, oranye = gagal. Makna ini tidak boleh ditukar.
3. Kontras teks di atas `--panel` minimal AA (`--muted` sekitar 6.4:1).
4. Hindari gradient ungu, glassmorphism, pill bulat penuh, dan bayangan blur bertumpuk.

---

## 6. Tipografi

Semua font **lokal**, tanpa CDN (NFR-PRIV-1).

| Peran | Stack | Gaya |
|-------|-------|------|
| Display (brand, stempel, judul panel, callsign) | `--font-display`: "Bahnschrift SemiBold Condensed" → "Bahnschrift" → "Arial Narrow" → Impact → sans-serif | UPPERCASE, `letter-spacing: .04em`, tebal |
| Body | `--font-ui`: "Segoe UI" → system-ui → sans-serif | `14px / 1.45` |
| Data (jam, token, biaya, path, id) | `--font-mono`: "Cascadia Mono" → Consolas → monospace | ukuran ikut konteks |

Bahnschrift sudah terpasang di Windows 10+. Kalau butuh konsistensi lintas OS, bundel font condensed OFL (misalnya Oswald) sebagai `public/fonts/*.woff2`.

| Elemen | Ukuran |
|--------|--------|
| Brand | display 22px |
| Judul panel | display 15px, warna `--accent` |
| Callsign di kartu | display 18px |
| Plang marker | display 14px `--text`; subjudul mono 9.5px muted |
| Label hero di peta | display 10px, stroke tinta 3px |
| Label kawasan | display 13px, `letter-spacing: .3em`, `--wire` opacity .55 |
| HUD sudut peta | mono 10px `--wire` (`PETA DISPATCH // SEKTOR 7`, koordinat, arah utara, skala) |
| Stempel | display 34px, rotasi −8° |
| Radio log | body 13px, jam mono 11px |

---

## 7. Bentuk & gaya komik

| Hal | Nilai |
|-----|-------|
| Outline | `2px solid var(--ink)` di semua panel, kartu, tombol, pin |
| Bayangan | **satu** bayangan keras: `4px 4px 0 var(--ink)`, tanpa blur |
| Radius | kartu/panel `6px`, tombol `4px`, badge `4px`, pin bulat |
| Halftone | `radial-gradient(var(--ink) 1px, transparent 1.4px) 0 0 / 6px 6px` opacity 0.25, hanya di header kartu dan portrait |
| Jarak | gutter 12px, gap 8px, padding panel 12px 14px, padding kartu 10px |
| Kartu hero | 210 × 96px: portrait 72px di kiri, info di kanan |
| Peta | **tanpa** outline tinta/bayangan komik; garis wireframe 1px, glow hanya pada jejak rute, paket, dan beacon |
| Scanline peta | overlay `repeating-linear-gradient` 4px, opacity 2.5%, supaya terasa seperti layar monitor dispatch |
| Hover kartu | `translate(-2px,-2px)` + bayangan jadi 6px, rotasi 0 → −1° |
| Tombol ditekan | `translate(2px,2px)` + bayangan jadi 2px (kesan ditekan) |

---

## 8. Komponen

### 8.1 Header
Brand `AI DISPATCH` + label `SHIFT 1` (kuning) + tagline mono muted `divisi hero // lokal`. Isinya, dari kiri ke kanan: jam `14:01`, `DI LAPANGAN 3/5` (hero yang tidak di HQ), `SELESAI 8` (commit shift ini), `BUDGET $1.40`, lalu badge `!! 1 PANGGILAN` (merah, berdenyut, dan klik = fokus ke panggilan tertua). Paling kanan ada toggle `SFX` dan `MUSIK` (terpisah) serta `MODE SERIUS`.

### 8.2 Radio log
- Baris: jam mono → callsign berwarna status + badge model kecil → kalimat.
- Terbaru di bawah, auto-scroll. Scroll manual menjeda auto-scroll dan memunculkan tombol `↓ terbaru`.
- Tone: delegasi teal (`Rex → Nova: …`), commit hijau diawali `✓`, error oranye diawali `✗`, panggilan merah diawali `☎`.
- Empty state: *"Frekuensi sepi. Terlalu sepi."*

### 8.3 Peta
- SVG isometrik wireframe (§3.1), `viewBox` berpusat di HQ dan mengikuti rasio panel, jadi peta selalu penuh. **Tidak ada pan, zoom, atau kamera yang bergerak.**
- Layer (bawah → atas): tanah, laut, jalan, gedung (diurutkan dari belakang ke depan), marker lokasi, tali (delegasi/radio), jejak rute, hero, efek (paket, stempel). Di atas SVG ada overlay scanline dan HUD sudut.
- Token hero: lingkaran r12 (sidekick r9) berwarna badge model, ring 2.5px warna status (putih saat di jalan), lettermark, dan callsign di bawah. Saat attention ada badge `!` merah. Hero terpilih diberi ring putus-putus putih.
- Jejak rute: garis 3px berwarna gedung tujuan dengan glow tipis, hilang saat hero tiba.
- Klik token = pilih hero (sidekick membuka detail induknya). Tooltip `<title>` berisi callsign, status, dan project.
- Tali delegasi: kurva teal putus-putus mengalir dari induk ke sidekick. Tali radio: garis titik-titik biru muda dari hero yang sedang bicara ke lawan bicaranya.

### 8.4 Roster
- **Strip portrait** di bawah layar, seperti jajaran hero di *Dispatch*.
- Kartu terdiri dari dua bagian:
  - **Portrait 72px** di kiri: latar warna badge model + halftone, lettermark besar, nomor shortcut di pojok, dan strip bawah berisi ikon status.
  - **Info** di kanan: callsign + varian model, status (ikon + label; saat di jalan "MENUJU {gedung}"), tugas satu baris, project (mono muted), dan stamina bar sebagai meter kesiapan.
- Urutan: nelpon markas → on mission → menyelidiki → di radio → standby → di markas. Kartu idle diredupkan; kartu attention naik 10px dengan border merah.
- Sidekick muncul sebagai chip kecil di atas kartu induk: `+ Rex-2`.
- Klik kartu memilih hero: token di peta diberi ring dan detail terbuka (peta tidak bergerak). Tombol `1`–`9` memilih kartu ke-n.

### 8.5 Detail hero
Slide dari kanan, 340px. Isinya:

- badge besar dan callsign, lalu nama sesi/model asli (mono muted),
- **radar profil kerja** (segi lima, ala grafik stat hero di *Dispatch*) dengan sumbu Coding, Membaca, Koordinasi, Menunggu, Shipping. Nilainya **porsi waktu nyata per status dalam 1 jam terakhir** (Shipping = jumlah commit dinormalisasi), bukan skor karangan. Isinya diwarnai status saat ini, dan `aria-label` memuat angkanya,
- status dan lokasi (gedung),
- tugas lengkap,
- project/repo dan branch,
- sidekick beserta lokasinya,
- file yang disentuh (5 terakhir, diberi warna baca/edit/buat),
- stamina (`182k / 200k tok`),
- biaya,
- riwayat misi (commit/error terakhir).

Tutup dengan `×` atau `Esc`.

### 8.6 Stamina bar
Tinggi 10px dengan outline tinta dan isi `--info`. Di atas 85% berubah jadi `--accent` dan diberi label `CAPEK`. Tetap `role="meter"` dengan `aria-valuenow`/`aria-valuemax`.

### 8.7 Incoming call (interaksi operator)

Ini komponen terpenting, karena satu-satunya tempat operator mengubah jalannya agen. Satu panel **Nelpon Markas**, tapi isinya bergantung pada `kind`.

#### `permission` — minta izin

```text
┌──────────────────────────────────────────┐
│ ☎ NELPON MARKAS  [IZIN]     00:42  [ × ] │
│ [CL] BYTE · Bengkel Kode · opskeu        │
│ "Boss, saya mau jalankan `go mod tidy`.  │
│  Ini akan mengubah go.sum. Boleh?"       │
│ ▸ perintah: go mod tidy                  │
│ [ SETUJUI  Y ]  [ TOLAK  N ]  [ BALAS  R ]│
└──────────────────────────────────────────┘
```

#### `choose` — agen bingung, kasih opsi

```text
┌──────────────────────────────────────────┐
│ ☎ NELPON MARKAS  [PILIH]    00:18  [ × ] │
│ [GP] NOVA · Menara Radio · one-bff-go    │
│ "Boss, kontrak X-User-* versi mana?"     │
│ ▸ konteks: review feat/identity-v2       │
│ [ 1  Ikuti draft BFF terbaru …     ]     │
│ [ 2  Tetap kontrak lama …          ]     │
│ [ 3  Tunda review — tunggu ADR …   ]     │
│ [ Lainnya…  R ]  → textarea custom       │
└──────────────────────────────────────────┘
```

#### `ask` — pertanyaan terbuka

```text
┌──────────────────────────────────────────┐
│ ☎ NELPON MARKAS  [TANYA]    00:11  [ × ] │
│ [GM] IVY · Perpustakaan · documents…     │
│ "Boss, path upload yang mana?"           │
│ ▸ kandidat: POST /upload · POST /v1/…    │
│ [ Jawab  R ]                             │
│ ┌ textarea jawaban (langsung terbuka) ┐  │
└──────────────────────────────────────────┘
```

| `kind` | Tombol | Shortcut (panel fokus) | Setelah dijawab |
|--------|--------|------------------------|-----------------|
| `permission` | Setujui / Tolak / Balas | Y / N / R | deny → standby; selain itu → mission |
| `choose` | satu tombol per `options[]` + Lainnya… | `1`–`9` / R | selalu lanjut mission; kirim `optionId` atau teks |
| `ask` | Jawab (teks wajib) | R fokususkan kotak; Ctrl+Enter kirim | selalu lanjut mission |

- **Kutipan** boleh bercanda; **baris `▸` / label opsi** = teks asli agen, tidak diubah.
- Tag mono di header (`IZIN` / `PILIH` / `TANYA`) biar operator tahu jenis panggilan sekilas.
- Status panel sama untuk semua kind: `ringing` → `sending` → `answered` / `failed` / `stale`.
- Persetujuan / pilihan **tidak pernah otomatis**; tidak ada timeout yang memilih opsi.
- Satu putaran jawab lalu panel tutup. Kalau agen nanya lagi = panggilan baru (bukan chat thread).
- Kontrak UI: `callId`, `kind ∈ {permission, choose, ask}`, `options?: {id,label}[]`, respons `decision ∈ {approve, deny, reply, option, other, answer}`, plus `optionId?` / `message?`.

### 8.8 Stempel
Muncul dengan scale 1.4 → 1 dan rotasi −8° dalam 180ms (efek dibanting), lalu memudar setelah 2.5s.

| Stempel | Warna | Kapan |
|---------|-------|-------|
| `BERES!` | `--ok` | commit |
| `WADUH` | `--fail` | error |
| `DIJAWAB` | `--info` | panggilan dijawab (semua kind) |
| `SUDAH LEWAT` | `--muted` | panggilan basi |

---

## 9. Copy & nada

- Bahasa Indonesia. Istilah game boleh English: *mission*, *standby*, *callsign*. Tipe event dan id tetap English.
- Brand: **AI DISPATCH** · tagline `divisi hero // lokal`.
- **Nada kantor komedi**: hero boleh berkarakter di radio log, dengan aturan:
  1. Tiap template menyisipkan fakta asli (file, perintah, repo). Lelucon hanya di bingkai kalimat.
  2. Maksimal satu lelucon per baris, dan kalimat ≤90 karakter.
  3. Error dan incoming call tetap jelas: bingkai boleh bercanda, tapi baris teknisnya tidak.
  4. **Mode serius** (toggle di header) mengganti semua template menjadi kalimat lugas. Contoh: `Rex membaca router.go`.
- Contoh template (mode komedi → mode serius):

| Event | Komedi | Serius |
|-------|--------|--------|
| read | `Rex: "Lagi baca {file}. Doakan saya."` | `Rex membaca {file}` |
| edit | `Rex: "Ngoprek {file}, jangan ganggu."` | `Rex mengedit {file}` |
| delegate | `Rex → Nova: "Tolong urus {task}, saya sibuk."` | `Rex mendelegasikan ke Nova: {task}` |
| dispatch | `HQ → Ivy: "Meluncur ke {gedung}. Jangan mampir."` (beberapa variasi, dipilih saat event dicatat lalu tidak berubah) | `HQ → Ivy: dikirim ke {gedung}` |
| commit | `✓ Rex: "Beres. {sha7} {msg}"` | `✓ Rex commit {sha7} {msg}` |
| error | `✗ Bolt: "Waduh. {error_short}"` | `✗ Bolt error: {error_short}` |
| attention (izin) | `☎ Bolt: "Boss, butuh izin dulu nih."` | `☎ Bolt menunggu keputusan operator` |
| attention (pilih) | `☎ Nova: "Boss, pilih satu dong."` | `☎ Nova menunggu pilihan operator` |
| attention (tanya) | `☎ Ivy: "Boss, saya bingung nih."` | `☎ Ivy menunggu jawaban operator` |
| idle | `Mochi balik ke markas, bikin kopi.` | `Mochi idle` |

- Format: token `182k` / `1.2M`, biaya `$1.40`, kosong `—`, jam 24 jam `id-ID`, potong teks dengan `…`.

---

## 10. Motion

| Gerak | Spec |
|-------|------|
| Boot | semua hero mulai di HQ, lalu diberangkatkan bergiliran tiap 450ms |
| Dispatch | hero jalan di sepanjang jalan: gedung lama → HQ → gedung baru. Kecepatan ≥420 unit/s, maks 2.2s per perjalanan. Jejak rute berwarna gedung tujuan (opacity 0.5) hilang saat tiba |
| Geser slot | hero lain di gedung yang sama bergeser ke slot barunya, 260 unit/s |
| Paket commit | berjalan lewat HQ ke Dermaga Kirim, maks 1.6s; atap dermaga menyala hijau 600ms saat tiba |
| Tali delegasi / radio | `stroke-dashoffset` mengalir, 1.5s / 1s per siklus, mengikuti posisi hero tiap frame |
| Ring progres misi | putar 1 putaran/3s (hanya saat sudah tiba) |
| Beacon HQ / menara | kedip `steps(2)` 1Hz |
| Incoming call | kartu naik 8px + satu goyangan 300ms; ring merah di token berdenyut 1Hz |
| Stempel | 180ms dibanting, tahan 2.5s, fade 400ms |
| Stamina | `width` 0.4s ease |
| Hover kartu | 120ms |
| Panel detail | slide 200ms |

Aturan:

- Kedipan/denyut maksimal 3 kali per detik.
- Gerak kecil yang terus-menerus = tanda sistem hidup; gerak besar = event.
- `prefers-reduced-motion`: goyang, perjalanan, paket, dan aliran tali dimatikan. Hero langsung muncul di gedung tujuan dan stempel tampil tanpa animasi. Denyut merah diganti border statis 3px.

---

## 11. Suara & musik

Semua dibuat dengan Web Audio sintetis, tanpa file. **Default mute.** SFX dan musik punya toggle terpisah.

| Suara | Kapan | Karakter |
|-------|-------|----------|
| Krrk radio | entri radio log (maks 1 per 1.5s) | noise pendek bandpass |
| Whoosh | hero diberangkatkan | noise sweep |
| Stempel "thunk" | commit | low thump + klik |
| Buzz pendek | error | square wave 120ms |
| **Dering telepon** | incoming call, **satu-satunya suara berulang** (2x lalu diam; ulang tiap 20s selama `ringing`) | dua nada bergantian |
| Klik tombol | tombol ditekan | tick |

**Musik ambient lo-fi**: pad akord 4 bar (Rhodes-ish, sine + detune), beat lembut 72 BPM, volume −24 dB. Musik otomatis ducking −8 dB saat dering. Di mode serius musik tetap bisa dinyalakan secara terpisah.

---

## 12. Jangan

- Fetch apa pun dari luar: webfont CDN, gambar, audio, ikon library dari CDN.
- Logo resmi vendor model, aset/karakter/nama dari *Dispatch* atau game lain.
- Merah selain incoming call; warna sebagai satu-satunya sinyal.
- Modal atau panel yang menutupi peta; persetujuan otomatis; shortcut respons yang aktif tanpa fokus.
- Pan, zoom, atau kamera yang bergerak di peta; operator harus selalu melihat seluruh kota.
- Hero yang berpindah gedung tanpa lewat HQ.
- Lelucon yang mengubah atau menyembunyikan isi teknis.
- Emoji sebagai ikon di UI final.
- Tabel/grid kartu dashboard, glassmorphism, gradient ungu, bayangan blur.

---

## 13. Checklist UI baru

- [ ] Warna dari token (`var(--…)`), tidak ada hex baru
- [ ] Status punya ikon + label, bukan hanya warna
- [ ] Angka, id, path, dan perintah memakai mono
- [ ] Copy punya versi komedi **dan** serius; fakta teknis utuh di keduanya
- [ ] Incoming call: kelima state (`ringing`, `sending`, `answered`, `failed`, `stale`) tergambar
- [ ] Bisa dipakai hanya dengan keyboard (Tab, 1–9, Space, Y/N/R, Esc)
- [ ] `prefers-reduced-motion` dicek
- [ ] Dicek di 900px dan 600px
- [ ] Tidak ada request jaringan baru

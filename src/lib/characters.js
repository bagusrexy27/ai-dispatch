import architect from '../assets/heroes/hero-rex.jpg'
import mechanic from '../assets/heroes/hero-byte.jpg'
import courier from '../assets/heroes/hero-mochi.jpg'
import negotiator from '../assets/heroes/hero-nova.jpg'
import archivist from '../assets/heroes/hero-ivy.jpg'
import wildcard from '../assets/heroes/hero-kilo.jpg'

export const ABILITY_LABELS = ['Penalaran', 'Coding', 'Kecepatan', 'Konteks', 'Hemat']

/* kartu karakter = bingkai fiksi per model; angka bukan hasil benchmark.
   face = [pusatX, pusatY, sisi] titik wajah di gambar, pecahan 0–1 dari lebar gambar persegi */
const CHARACTERS = {
  architect: {
    image: architect,
    face: [0.52, 0.29, 0.38],
    title: 'Sang Arsitek',
    role: 'Strategist · Tank',
    tagline: 'Melihat seluruh bangunan sebelum memasang bata pertama.',
    abilities: [96, 93, 40, 88, 25],
    special: { name: 'Cetak Biru Agung', desc: 'Refactor lintas modul dalam satu tarikan napas, lengkap dengan rencana migrasi.' },
    weakness: 'Mikirnya lama dan tarifnya paling mahal di markas.',
  },
  mechanic: {
    image: mechanic,
    face: [0.48, 0.28, 0.4],
    title: 'Si Montir',
    role: 'Engineer · All-rounder',
    tagline: 'Kalau rusak, dibetulkan. Kalau belum rusak, dites dulu.',
    abilities: [84, 90, 72, 85, 62],
    special: { name: 'Kunci Inggris Serbaguna', desc: 'Perbaiki bug, tulis tes, dan rapikan import tanpa drama.' },
    weakness: 'Kadang terlalu rajin menambah hal yang tidak diminta.',
  },
  courier: {
    image: courier,
    face: [0.5, 0.3, 0.42],
    title: 'Kurir Kilat',
    role: 'Scout · Speedster',
    tagline: 'Sudah sampai sebelum kamu selesai mengetik.',
    abilities: [55, 62, 97, 65, 96],
    special: { name: 'Antar Kilat', desc: 'Tugas kecil beres dalam hitungan detik dengan biaya receh.' },
    weakness: 'Tugas berlapis-lapis bikin tersandung.',
  },
  negotiator: {
    image: negotiator,
    face: [0.5, 0.28, 0.36],
    title: 'Sang Negosiator',
    role: 'Diplomat · Support',
    tagline: 'Semua pihak didengar, satu keputusan dibawa pulang.',
    abilities: [88, 84, 70, 82, 58],
    special: { name: 'Meja Perundingan', desc: 'Merangkum kontrak, review, dan pendapat tim jadi satu rekomendasi.' },
    weakness: 'Terlalu diplomatis; jawabannya kadang muter dulu.',
  },
  archivist: {
    image: archivist,
    face: [0.49, 0.29, 0.38],
    title: 'Pustakawan Kilat',
    role: 'Archivist · Reader',
    tagline: 'Satu repo, sepuluh dokumen, tiga screenshot. Sekali baca.',
    abilities: [72, 74, 92, 98, 85],
    special: { name: 'Badai Halaman', desc: 'Melahap seluruh repo, dokumen, dan gambar sekaligus tanpa kehabisan napas.' },
    weakness: 'Detail kecil di halaman ke-900 kadang terlewat.',
  },
  wildcard: {
    image: wildcard,
    face: [0.47, 0.35, 0.44],
    title: 'Si Nekat',
    role: 'Wildcard · Brawler',
    tagline: 'Kabar terbaru di telinga, tombol hapus di jari.',
    abilities: [78, 76, 80, 80, 60],
    special: { name: 'Siaran Langsung', desc: 'Selalu tahu kabar terbaru dari lapangan dan berani ambil jalan pintas.' },
    weakness: 'Nekat. Awasi sebelum dia menyentuh perintah destruktif.',
  },
}

const BY_VARIANT = { 'CL:Opus': 'architect', 'CL:Sonnet': 'mechanic', 'CL:Haiku': 'courier' }
const BY_MODEL = { CL: 'mechanic', GP: 'negotiator', GM: 'archivist', GK: 'wildcard' }

export function characterFor(hero) {
  const key = BY_VARIANT[`${hero.model}:${hero.variant}`] ?? BY_MODEL[hero.model]
  return key ? CHARACTERS[key] : null
}

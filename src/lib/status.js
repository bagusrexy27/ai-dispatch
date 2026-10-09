export const STATUS = {
  attention: { label: 'Nelpon markas', color: 'var(--alert)', order: 0, loc: null },
  coding: { label: 'On mission', color: 'var(--st-mission)', order: 1, loc: 'coding' },
  reading: { label: 'Menyelidiki', color: 'var(--st-investigate)', order: 2, loc: 'investigate' },
  talking: { label: 'Di radio', color: 'var(--st-radio)', order: 3, loc: 'radio' },
  waiting: { label: 'Standby', color: 'var(--st-standby)', order: 4, loc: 'standby' },
  idle: { label: 'Di markas', color: 'var(--st-idle)', order: 5, loc: 'hq' },
}

export const LOC_NAMES = {
  hq: 'HQ',
  coding: 'Bengkel Kode',
  radio: 'Menara Radio',
  investigate: 'Perpustakaan',
  standby: 'Ruang Tunggu',
  dock: 'Dermaga Kirim',
}

export const STAT_LABELS = ['Coding', 'Membaca', 'Koordinasi', 'Menunggu', 'Shipping']

export const MODEL_BG = { CL: '#e9a36b', GP: '#9be3c7', GM: '#a9b8ff', GK: '#d6d6d6' }

export const KIND_TAG = { permission: 'IZIN', choose: 'PILIH', ask: 'TANYA' }

export function fmtTok(n) {
  return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.round(n / 1000) + 'k'
}

export const LOCATIONS = {
  hq: { label: 'HQ', x: 400, y: 225 },
  coding: { label: 'Bengkel Kode', x: 150, y: 95 },
  radio: { label: 'Menara Radio', x: 650, y: 95 },
  investigate: { label: 'Perpustakaan', x: 150, y: 355 },
  standby: { label: 'Ruang Tunggu', x: 650, y: 355 },
  dock: { label: 'Dermaga Kirim', x: 400, y: 410 },
}

export const STATUS = {
  coding: { label: 'ON MISSION', loc: 'coding' },
  reading: { label: 'MENYELIDIKI', loc: 'investigate' },
  talking: { label: 'DI RADIO', loc: 'radio' },
  waiting: { label: 'STANDBY', loc: 'standby' },
  idle: { label: 'DI MARKAS', loc: 'hq' },
  attention: { label: 'NELPON MARKAS', loc: null },
}

export const STAT_LABELS = ['Coding', 'Membaca', 'Koordinasi', 'Menunggu', 'Shipping']

export const MODELS = {
  CL: { name: 'Claude', color: '#e8875b' },
  GP: { name: 'GPT', color: '#5bc8a8' },
  GM: { name: 'Gemini', color: '#6b9cf0' },
  GR: { name: 'Grok', color: '#c9c9d4' },
}

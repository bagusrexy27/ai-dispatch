import { STATUS } from './status'

const DECISIONS = {
  approve: 'disetujui',
  deny: 'ditolak',
  reply: 'dibalas',
  option: 'opsi dipilih',
  other: 'jawaban lain',
  answer: 'dijawab',
}

export function logLine(e, serious) {
  const who = e.callsign
  switch (e.type) {
    case 'status':
      return serious ? `${who}: status ${STATUS[e.status].label}` : `${who} pindah pos, sekarang ${STATUS[e.status].label}`
    case 'read':
      return serious ? `${who} membaca ${e.file}` : `${who} ngintip ${e.file}`
    case 'edit':
      return serious ? `${who} mengedit ${e.file}` : `${who} ngoprek ${e.file}`
    case 'commit':
      return serious ? `${who} commit ${e.sha}: ${e.message}` : `BERES! ${who} kirim paket ${e.sha}: ${e.message}`
    case 'error':
      return serious ? `${who} error: ${e.error}` : `WADUH! ${who} kesandung: ${e.error}`
    case 'delegate':
      return serious ? `${who} mendelegasikan "${e.task}" ke ${e.sidekick.callsign}` : `${who} manggil sidekick ${e.sidekick.callsign} buat ${e.task}`
    case 'sidekick_end':
      return serious ? `${e.sidekickCallsign} selesai, kembali ke ${who}` : `${e.sidekickCallsign} beres bantu ${who}, pamit dulu`
    case 'call_open':
      return serious ? `${who} meminta keputusan operator` : `${who} nelpon markas!`
    case 'call_result': {
      const detail = e.message ? `: "${e.message}"` : e.optionLabel ? `: ${e.optionLabel}` : ''
      return `${who}: panggilan ${DECISIONS[e.decision]}${detail}`
    }
    default:
      return `${who}: ${e.type}`
  }
}

export function formatClock(ts) {
  return new Date(ts).toLocaleTimeString('id-ID', { hour12: false })
}

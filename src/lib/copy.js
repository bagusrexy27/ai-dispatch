import { LOC_NAMES, STATUS } from './status.js'

const DISPATCH_JOKES = ['"Meluncur ke {l}. Jangan mampir."', '"Ke {l}, sekarang. Kopinya nanti."', '"{l} butuh kamu. Katanya."', '"Berangkat ke {l}. Hati-hati di jalan."']

const CALL_JOKES = { choose: '"Boss, pilih satu dong."', ask: '"Boss, saya bingung nih."', permission: '"Boss, butuh izin dulu nih."' }
const CALL_SERIOUS = { choose: 'menunggu pilihan operator', ask: 'menunggu jawaban operator', permission: 'menunggu keputusan operator' }
const CLOSE_REASONS = { failed: 'gagal diteruskan', stale: 'sudah lewat', dismissed: 'dibatalkan agen' }

/* teks berpotongan: string biasa atau { code } untuk path/perintah */
const code = (c) => ({ code: c })

export function decisionText(e) {
  switch (e.decision) {
    case 'approve': return '✓ disetujui'
    case 'deny': return '✗ ditolak'
    case 'option': return `pilih [${e.optionId}] ${e.optionLabel ?? ''}`.trim()
    case 'other': return `lainnya: "${e.message}"`
    case 'answer': return `jawab: "${e.message}"`
    default: return `balas: "${e.message}"`
  }
}

/* → { tone, who, whoColor, text: (string | {code})[] } */
export function logParts(e, serious) {
  const who = e.callsign
  switch (e.type) {
    case 'status': {
      if (e.status === 'idle') return { tone: '', who, whoColor: 'var(--st-idle)', text: [serious ? 'kembali ke HQ (idle)' : 'balik ke markas, bikin kopi.'] }
      const l = LOC_NAMES[STATUS[e.status].loc]
      return { tone: 'hq', who: `HQ → ${who}`, text: [serious ? `dikirim ke ${l}` : DISPATCH_JOKES[e.id % DISPATCH_JOKES.length].replace('{l}', l)] }
    }
    case 'read':
      return { tone: '', who, whoColor: 'var(--st-investigate)', text: serious ? ['membaca ', code(e.file)] : ['"Lagi baca ', code(e.file), '. Doakan saya."'] }
    case 'edit':
      return { tone: '', who, whoColor: 'var(--st-mission)', text: serious ? ['mengedit ', code(e.file)] : ['"Lagi ngoprek ', code(e.file), '. Jangan diganggu."'] }
    case 'commit':
      return { tone: 'ok', prefix: '✓ ', who, text: [serious ? 'commit ' : '"Beres, paket dikirim." ', code(e.sha), ` ${e.message}`] }
    case 'error':
      return { tone: 'fail', prefix: '✗ ', who, text: [serious ? 'error: ' : '"Waduh." ', code(e.error)] }
    case 'delegate':
      return { tone: 'deleg', who: `${who} → ${e.sidekick.callsign}`, text: [serious ? `delegasi: ${e.task}` : `"Tolong urus ${e.task}, saya sibuk."`] }
    case 'sidekick_end':
      return { tone: 'deleg', who: e.sidekickCallsign, text: [serious ? `selesai, kembali ke ${who}` : `"Beres bantu ${who}. Pamit."`] }
    case 'call_open':
      return { tone: 'call', prefix: '☎ ', who, text: [serious ? CALL_SERIOUS[e.call.kind] : CALL_JOKES[e.call.kind]] }
    case 'call_result':
      return { tone: 'deleg', who: `HQ → ${who}`, text: [decisionText(e)] }
    case 'call_closed':
      return { tone: 'fail', who, text: [`panggilan ditutup (${CLOSE_REASONS[e.reason] ?? e.reason})`] }
    case 'session_end':
      return { tone: '', who, whoColor: 'var(--st-idle)', text: [serious ? 'sesi berakhir' : 'pulang, shift selesai.'] }
    case 'notice':
      return { tone: 'fail', who: 'MARKAS', text: [e.text] }
    default:
      return { tone: '', who, text: [e.type] }
  }
}

export function formatClock(ts, withSeconds = true) {
  const s = new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  return withSeconds ? s : s.slice(0, 5)
}

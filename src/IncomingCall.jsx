import { useEffect, useRef, useState } from 'react'
import { Icon } from './lib/icons'
import { KIND_TAG, LOC_NAMES } from './lib/status'
import { Rich } from './RadioLog'
import { HeroFace } from './HeroFace'

const TEXT_DECISION = { permission: 'reply', choose: 'other', ask: 'answer' }

function useElapsed(startedAt, running) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [running])
  const s = Math.max(0, Math.floor((now - startedAt) / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const backticks = (text) => text.split('`').map((part, i) => (i % 2 ? { code: part } : part))

function IncomingCall({ call, hero, serious, closing, queued, onAnswer, panelRef }) {
  const [text, setText] = useState('')
  const [writing, setWriting] = useState(call.kind === 'ask')
  const textRef = useRef(null)
  const ringing = !closing && call.state !== 'sending'
  const elapsed = useElapsed(call.startedAt, ringing)

  useEffect(() => {
    if (writing && call.kind !== 'ask') textRef.current?.focus()
  }, [writing, call.kind])

  const answer = (decision, extra = {}) => {
    if (ringing) onAnswer(call, decision, extra)
  }

  function openText() {
    setWriting(true)
    textRef.current?.focus()
    if (call.kind === 'ask' && text.trim()) submitText()
  }

  function submitText() {
    const message = text.trim()
    if (message) answer(TEXT_DECISION[call.kind], { message })
    else textRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (e.target.tagName === 'TEXTAREA') {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault()
        submitText()
      }
      e.stopPropagation()
      return
    }
    if (!ringing) return
    const key = e.key.toLowerCase()
    if (call.kind === 'permission' && key === 'y') answer('approve')
    else if (call.kind === 'permission' && key === 'n') answer('deny')
    else if (key === 'r') openText()
    else if (call.kind === 'choose' && /^[1-9]$/.test(key)) {
      const opt = call.options[Number(key) - 1]
      if (!opt) return
      answer('option', { optionId: opt.id, optionLabel: opt.label })
    } else return
    e.preventDefault()
    e.stopPropagation()
  }

  const statusLine = closing?.line ?? (call.state === 'sending' ? `Mengirim ke ${hero.callsign}…` : call.state === 'failed' ? 'Gagal terkirim. Coba jawab lagi.' : '')
  const locked = !ringing

  return (
    <section ref={panelRef} tabIndex={-1} className={`call box${ringing ? ' ringing' : ''}`} onKeyDown={handleKeyDown} aria-label={`Panggilan masuk dari ${hero.callsign}`}>
      <div className="call-head">
        <Icon name="attention" />NELPON MARKAS<span className="kind-tag">{KIND_TAG[call.kind]}</span>
        <span className="timer">{elapsed}</span>
      </div>
      <div className="call-body">
        <div className="call-who">
          <HeroFace hero={hero} className="face-md" />
          <span className="cs display">{hero.callsign}</span>
          <span className="where mono">· {LOC_NAMES[hero.loc]} · {hero.project}</span>
        </div>
        <p className="quote">{serious ? call.quoteSerious : <>“<Rich parts={backticks(call.quote)} />”</>}</p>
        <div className="tech">{call.techLine}</div>

        {call.kind === 'permission' && (
          <div className="call-actions">
            <button type="button" className="btn b-approve" disabled={locked} onClick={() => answer('approve')}>Setujui<kbd>Y</kbd></button>
            <button type="button" className="btn b-deny" disabled={locked} onClick={() => answer('deny')}>Tolak<kbd>N</kbd></button>
            <button type="button" className="btn" disabled={locked} onClick={openText}>Balas<kbd>R</kbd></button>
          </div>
        )}
        {call.kind === 'choose' && (
          <div className="call-actions stack">
            {call.options.map((o, i) => (
              <button key={o.id} type="button" className="btn" disabled={locked} onClick={() => answer('option', { optionId: o.id, optionLabel: o.label })}>
                <span className="opt-id">{i + 1}</span>{o.label}<kbd>{i + 1}</kbd>
              </button>
            ))}
            <button type="button" className="btn" disabled={locked} onClick={openText}>Lainnya…<kbd>R</kbd></button>
          </div>
        )}
        {call.kind === 'ask' && (
          <div className="call-actions">
            <button type="button" className="btn b-answer" disabled={locked} onClick={openText}>Jawab<kbd>R</kbd></button>
          </div>
        )}

        {writing && (
          <div className="reply">
            <textarea
              ref={textRef}
              value={text}
              disabled={locked}
              onChange={(e) => setText(e.target.value)}
              placeholder={`${call.kind === 'ask' ? 'Jawaban' : call.kind === 'choose' ? 'Jawaban custom' : 'Pesan'} untuk ${hero.callsign}… (Ctrl+Enter kirim)`}
            />
          </div>
        )}
        <div className="hint-focus">
          {call.kind === 'permission' && 'Shortcut Y/N/R aktif setelah panel difokuskan (klik atau Space).'}
          {call.kind === 'choose' && `Shortcut 1–${call.options.length} / R = Lainnya, setelah panel difokuskan.`}
          {call.kind === 'ask' && 'Ketik jawaban, lalu Ctrl+Enter atau klik Jawab. Shortcut R memfokuskan kotak teks.'}
        </div>
        <div className={`call-status${call.state === 'failed' ? ' failed' : ''}`} role="status">{statusLine}</div>
        {queued > 0 && <div className="call-queue mono">+{queued} panggilan antre</div>}
        {closing && <div className="call-stamp">DIJAWAB</div>}
      </div>
    </section>
  )
}

export default IncomingCall

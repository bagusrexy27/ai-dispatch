import { useEffect, useState } from 'react'

function useElapsed(startedAt) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const s = Math.max(0, Math.floor((now - startedAt) / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const TEXT_DECISION = { permission: 'reply', choose: 'other', ask: 'answer' }

function IncomingCall({ call, hero, serious, onAnswer, panelRef }) {
  const [text, setText] = useState('')
  const [writing, setWriting] = useState(call.kind === 'ask')
  const elapsed = useElapsed(call.startedAt)

  const answer = (decision, extra = {}) => onAnswer(call, decision, extra)

  function submitText() {
    const message = text.trim()
    if (message) answer(TEXT_DECISION[call.kind], { message })
  }

  function handleKeyDown(e) {
    if (e.target.tagName === 'TEXTAREA') {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault()
        submitText()
      }
      if (e.key === 'Escape' && call.kind !== 'ask') setWriting(false)
      e.stopPropagation()
      return
    }
    const key = e.key.toLowerCase()
    if (call.kind === 'permission' && key === 'y') answer('approve')
    else if (call.kind === 'permission' && key === 'n') answer('deny')
    else if (call.kind !== 'ask' && key === 'r') setWriting(true)
    else if (call.kind === 'choose' && /^[1-9]$/.test(key)) {
      const opt = call.options[Number(key) - 1]
      if (opt) answer('option', { optionId: opt.id, optionLabel: opt.label })
    } else return
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <section ref={panelRef} tabIndex={-1} className={`incoming-call call-${call.kind}`} onKeyDown={handleKeyDown} aria-label={`Panggilan dari ${hero.callsign}`}>
      <div className="call-head">
        <span className="ring-dot" aria-hidden="true" />
        <strong>{hero.callsign}</strong>
        <span className="muted">{call.kind.toUpperCase()}</span>
        <span className="mono muted call-timer">{elapsed}</span>
      </div>
      <p className="quote">“{serious ? call.quoteSerious : call.quote}”</p>
      <p className="mono tech">▸ {call.techLine}</p>

      {call.kind === 'permission' && (
        <div className="call-actions">
          <button type="button" className="approve" onClick={() => answer('approve')}>Setujui <kbd>Y</kbd></button>
          <button type="button" className="deny" onClick={() => answer('deny')}>Tolak <kbd>N</kbd></button>
          <button type="button" onClick={() => setWriting(true)}>Balas <kbd>R</kbd></button>
        </div>
      )}

      {call.kind === 'choose' && (
        <div className="call-actions call-options">
          {call.options.map((opt, i) => (
            <button key={opt.id} type="button" onClick={() => answer('option', { optionId: opt.id, optionLabel: opt.label })}>
              <kbd>{i + 1}</kbd> {opt.label}
            </button>
          ))}
          <button type="button" onClick={() => setWriting(true)}>Lainnya <kbd>R</kbd></button>
        </div>
      )}

      {writing && (
        <div className="call-reply">
          <textarea
            autoFocus={call.kind !== 'ask'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={call.kind === 'ask' ? 'Jawaban untuk hero (wajib)' : 'Tulis balasan'}
            rows={2}
          />
          <button type="button" onClick={submitText} disabled={!text.trim()}>Kirim <kbd>Ctrl+Enter</kbd></button>
        </div>
      )}
    </section>
  )
}

export default IncomingCall

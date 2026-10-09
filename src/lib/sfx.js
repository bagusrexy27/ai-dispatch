let ctx = null
let enabled = false
let music = null
let lastKrrk = 0
const KRRK_GAP_MS = 1500

const audio = () => (ctx ??= new AudioContext())

function tone(f, d, type = 'sine', v = 0.08, t0 = 0) {
  const a = audio(), o = a.createOscillator(), g = a.createGain()
  o.type = type
  o.frequency.value = f
  g.gain.setValueAtTime(v, a.currentTime + t0)
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t0 + d)
  o.connect(g).connect(a.destination)
  o.start(a.currentTime + t0)
  o.stop(a.currentTime + t0 + d)
}

function noise(d, freq, v = 0.05, sweep) {
  const a = audio(), b = a.createBuffer(1, a.sampleRate * d, a.sampleRate), x = b.getChannelData(0)
  for (let i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain()
  s.buffer = b
  f.type = 'bandpass'
  f.frequency.value = freq
  if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, a.currentTime + d)
  g.gain.setValueAtTime(v, a.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + d)
  s.connect(f).connect(g).connect(a.destination)
  s.start()
}

function duck() {
  if (!music) return
  const g = music.master.gain, t = ctx.currentTime
  g.setValueAtTime(0.02, t)
  g.linearRampToValueAtTime(0.05, t + 3)
}

export function setSfx(on) {
  enabled = on
  if (on) audio()
}

export function sfx(kind) {
  if (!enabled) return
  if (kind === 'krrk') {
    if (Date.now() - lastKrrk < KRRK_GAP_MS) return
    lastKrrk = Date.now()
    noise(0.08, 1800, 0.04)
  }
  if (kind === 'whoosh') noise(0.35, 400, 0.05, 2400)
  if (kind === 'ring') {
    duck()
    for (let i = 0; i < 2; i++) {
      tone(880, 0.35, 'sine', 0.08, i * 0.8)
      tone(660, 0.35, 'sine', 0.08, i * 0.8 + 0.4)
    }
  }
  if (kind === 'thunk') {
    tone(90, 0.2, 'sine', 0.2)
    noise(0.03, 3000, 0.05)
  }
  if (kind === 'buzz') tone(120, 0.12, 'square', 0.04)
  if (kind === 'click') tone(1400, 0.03, 'square', 0.03)
}

const CHORDS = [[220, 277, 330, 415], [196, 247, 294, 370], [175, 220, 262, 330], [196, 247, 294, 392]]
const BAR_MS = 3333

export function setMusic(on) {
  if (!on) {
    if (!music) return
    clearInterval(music.id)
    music.master.disconnect()
    music = null
    return
  }
  if (music) return
  const a = audio(), master = a.createGain()
  master.gain.value = 0.05
  master.connect(a.destination)
  let i = 0
  const play = () => {
    const t = a.currentTime
    CHORDS[i++ % 4].forEach((f) => {
      for (const det of [0, 3]) {
        const o = a.createOscillator(), g = a.createGain()
        o.type = 'sine'
        o.frequency.value = f
        o.detune.value = det
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(0.18, t + 0.4)
        g.gain.linearRampToValueAtTime(0, t + 3.3)
        o.connect(g).connect(master)
        o.start(t)
        o.stop(t + 3.4)
      }
    })
    ;[0, 0.83, 1.67, 2.5].forEach((b, j) => {
      const o = a.createOscillator(), g = a.createGain()
      o.frequency.value = j % 2 ? 140 : 60
      g.gain.setValueAtTime(0.25, t + b)
      g.gain.exponentialRampToValueAtTime(0.001, t + b + 0.15)
      o.connect(g).connect(master)
      o.start(t + b)
      o.stop(t + b + 0.2)
    })
  }
  play()
  music = { master, id: setInterval(play, BAR_MS) }
}

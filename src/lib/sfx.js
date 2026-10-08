let ctx = null

export function ring() {
  ctx ??= new AudioContext()
  const now = ctx.currentTime
  for (const offset of [0, 0.25]) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.06, now + offset)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now + offset)
    osc.stop(now + offset + 0.2)
  }
}

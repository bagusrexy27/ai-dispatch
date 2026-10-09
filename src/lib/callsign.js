const WORDS = ['Rex', 'Nova', 'Byte', 'Iroh', 'Vega', 'Juno', 'Kilo', 'Mako', 'Pixel', 'Orca', 'Zed', 'Lumen', 'Tango', 'Echo', 'Sable', 'Quill']

export function callsignFor(sessionId) {
  let hash = 0
  for (const ch of sessionId) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return WORDS[hash % WORDS.length]
}

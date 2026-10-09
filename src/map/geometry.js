/* Tampak miring: tanah diputar -16° lalu dipipihkan 0.56, z = tinggi. HQ di (0,0). */
const S = 11, TL = 0.56, ZS = 10, ROT = (-16 * Math.PI) / 180
export const CO = Math.cos(ROT), SI = Math.sin(ROT)
export const P = (x, y, z = 0) => [S * (CO * x - SI * y), S * TL * (SI * x + CO * y) - z * ZS]
export const GROUND = `matrix(${S * CO} ${S * TL * SI} ${-S * SI} ${S * TL * CO} 0 0)`
export const q = (p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)
export const pts = (a) => a.map(q).join(' ')
export const R = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]

/* garis pantai: laut di barat */
export const coastX = (y) => -36 + 5 * Math.sin(y / 17)
export const inSea = (x, y, m = 0) => x < coastX(y) + m
export const crx = (y) => coastX(y) + 9

/* jaringan jalan: grid tegak lurus + jalan pantai; semua persimpangan 90° */
export const XS = [-8, 8, 24, 40, 56, 72, 88], YS = [-72, -56, -40, -24, -8, 8, 24, 40, 56, 72]
export const ART_X = [8], ART_Y = [8]
const SHIFT_X = { 24: (y) => (y >= 24 ? 6 : 0) }, SHIFT_Y = { 40: (x) => (x >= 40 ? 4 : 0) }
/* `v:40:-8` sengaja TIDAK di-omit: butuh avenue di barat twin hotel (~48,8). */
const OMIT = new Set(['h:-8:-40', 'h:-8:40'])
export const gx = (x, y) => x + (SHIFT_X[x] ? SHIFT_X[x](y) : 0)
export const gy = (x, y) => y + (SHIFT_Y[y] ? SHIFT_Y[y](x) : 0)
const SPLITS = { H: [0, 8], n_bengkel: [-15, 8], n_menara: [16, -24], n_perpus: [32, 8], n_tunggu: [16, 24] }
export const NODES = { ...SPLITS }
export const ROADS = []
for (const x of XS) for (const y of YS) NODES[`g${x}_${y}`] = [gx(x, y), gy(x, y)]
const CY = []
for (let y = YS[0] - 16; y <= YS[YS.length - 1] + 16; y += 8) {
  CY.push(y)
  NODES['c' + y] = [crx(y), y]
}

function link(a, b, w, dir) {
  const [ax, ay] = NODES[a], [bx, by] = NODES[b]
  for (const [k, [px, py]] of Object.entries(SPLITS)) {
    const on = dir === 'h'
      ? ay === by && py === ay && px > Math.min(ax, bx) && px < Math.max(ax, bx)
      : ax === bx && px === ax && py > Math.min(ay, by) && py < Math.max(ay, by)
    if (on) {
      link(a, k, w, dir)
      link(k, b, w, dir)
      return
    }
  }
  ROADS.push([a, b, w, dir === 'h' ? [ax + (bx - ax) / 3, ay] : [ax, ay + (by - ay) / 3], dir === 'h' ? [bx - (bx - ax) / 3, by] : [bx, by - (by - ay) / 3]])
}

for (const y of YS) {
  const w = ART_Y.includes(y) ? 1.4 : 1.05
  link('c' + y, `g${XS[0]}_${y}`, w, 'h')
  for (let i = 0; i + 1 < XS.length; i++) if (!OMIT.has(`h:${XS[i]}:${y}`)) link(`g${XS[i]}_${y}`, `g${XS[i + 1]}_${y}`, w, 'h')
}
for (const x of XS) {
  const w = ART_X.includes(x) ? 1.4 : 1.05
  for (let j = 0; j + 1 < YS.length; j++) if (!OMIT.has(`v:${x}:${YS[j]}`)) link(`g${x}_${YS[j]}`, `g${x}_${YS[j + 1]}`, w, 'v')
}
{
  const c = (i) => NODES['c' + CY[Math.max(0, Math.min(CY.length - 1, i))]]
  for (let k = 0; k + 1 < CY.length; k++) {
    const p0 = c(k), p1 = c(k + 1)
    const t0 = [(c(k + 1)[0] - c(k - 1)[0]) / 6, (c(k + 1)[1] - c(k - 1)[1]) / 6]
    const t1 = [(c(k + 2)[0] - c(k)[0]) / 6, (c(k + 2)[1] - c(k)[1]) / 6]
    ROADS.push(['c' + CY[k], 'c' + CY[k + 1], 1.4, [p0[0] + t0[0], p0[1] + t0[1]], [p1[0] - t1[0], p1[1] - t1[1]]])
  }
}
export const RAIL = [[crx(-48), -48], [130, -48]]

/* gedung kerja; key = LocationId domain */
export const LOCS = {
  hq: { name: 'HQ', sub: 'hub dispatch', foot: [-3.2, -4.6, 3.2, 0.9], h: 5.8, door: [0, 1], node: 'H', color: 'var(--accent)', icon: 'hq' },
  coding: { name: 'Bengkel Kode', sub: 'coding', foot: [-17.5, 14.2, -12.5, 17.6], h: 2.8, door: [-15, 13.8], node: 'n_bengkel', color: 'var(--st-mission)', icon: 'coding' },
  radio: { name: 'Menara Radio', sub: 'koordinasi', foot: [14.8, -30.2, 17.2, -27.8], h: 4.6, door: [16, -27.3], node: 'n_menara', color: 'var(--st-radio)', icon: 'talking', slim: true },
  investigate: { name: 'Perpustakaan', sub: 'membaca', foot: [29.2, -3.6, 34.6, -0.2], h: 3.1, door: [32, 0.9], node: 'n_perpus', color: 'var(--st-investigate)', icon: 'reading' },
  standby: { name: 'Ruang Tunggu', sub: 'standby', foot: [13, 13.8, 19, 16.2], h: 2.0, door: [16, 18.2], node: 'n_tunggu', color: 'var(--st-standby)', icon: 'waiting' },
  dock: { name: 'Dermaga Kirim', sub: 'commit', foot: [-36.5, -10.5, -33.2, -5.2], h: 1.4, door: [-32.8, -8], node: 'c-8', color: 'var(--ok)', icon: 'box' },
}

for (const [k, L] of Object.entries(LOCS)) {
  const [x0, y0, x1, y1] = L.foot
  L.cx = (x0 + x1) / 2
  L.cy = (y0 + y1) / 2
  const [rx, ry] = P(L.cx, L.cy, L.h + (L.slim ? 1.2 : 0))
  L.roof = [rx, ry]
  L.anchor = L.slim ? [rx + 70, ry + 30] : [rx, P(L.cx, L.cy, L.h)[1] - 44]
  NODES['@' + k] = L.door
  const [ax, ay] = L.door, [bx, by] = NODES[L.node]
  ROADS.push(['@' + k, L.node, 0.85, [ax + (bx - ax) / 3, ay + (by - ay) / 3], [bx - (bx - ax) / 3, by - (by - ay) / 3]])
}

/* ruas jalan (Bezier kubik) → titik sampel (dunia), graf untuk rute hero */
export const EDGE = {}
const ADJ = {}
for (const [a, b, w, c1, c2] of ROADS) {
  const [ax, ay] = NODES[a], [bx, by] = NODES[b], len = Math.hypot(bx - ax, by - ay), n = Math.max(2, Math.ceil(len / 0.6)), p = []
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t
    p.push([u * u * u * ax + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * bx, u * u * u * ay + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * by])
  }
  EDGE[a + '>' + b] = { p, w }
  EDGE[b + '>' + a] = { p: [...p].reverse(), w }
  ;(ADJ[a] ??= []).push([b, len])
  ;(ADJ[b] ??= []).push([a, len])
}

function nodePath(a, b) {
  const dist = { [a]: 0 }, prev = {}, open = new Set([a])
  while (open.size) {
    let u = null
    for (const n of open) if (u === null || dist[n] < dist[u]) u = n
    open.delete(u)
    if (u === b) break
    for (const [v, l] of ADJ[u]) {
      const d = dist[u] + l
      if (dist[v] === undefined || d < dist[v]) {
        dist[v] = d
        prev[v] = u
        open.add(v)
      }
    }
  }
  const out = [b]
  while (out[0] !== a) out.unshift(prev[out[0]])
  return out
}

function roadPts(a, b) {
  const ns = nodePath(a, b), out = [NODES[a]]
  for (let i = 1; i < ns.length; i++) out.push(...EDGE[ns[i - 1] + '>' + ns[i]].p.slice(1))
  return out
}

/* rute selalu lewat HQ (hub-and-spoke), dalam koordinat layar */
export function worldRoute(from, to) {
  return [...roadPts('@' + from, 'H'), ...roadPts('H', '@' + to).slice(1)].map(([x, y]) => P(x, y))
}

export function pathLen(p) {
  let l = 0
  for (let i = 1; i < p.length; i++) l += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])
  return l
}

export function along(p, d) {
  for (let i = 1; i < p.length; i++) {
    const [x0, y0] = p[i - 1], [x1, y1] = p[i], seg = Math.hypot(x1 - x0, y1 - y0)
    if (d <= seg || i === p.length - 1) {
      const t = seg ? Math.min(1, d / seg) : 1
      return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]
    }
    d -= seg
  }
  return p[p.length - 1]
}

/** Zoom in maksimal (3× framing default). */
export const MAP_ZOOM_MAX = 3
/**
 * Zoom out maksimal. Viewport di level ini = seluruh “scope” peta:
 * pan terkunci; zoom in di atas ini boleh geser dalam scope yang sama.
 */
export const MAP_ZOOM_MIN = 0.8

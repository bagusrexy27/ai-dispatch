import { CO, SI, P, GROUND, q, pts, R, coastX, inSea, crx, XS, YS, gx, gy, ROADS, NODES, EDGE, RAIL, LOCS } from './geometry.js'

let seed = 23
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
const qw = (p) => p[0].toFixed(2) + ',' + p[1].toFixed(2)
const ptsW = (a) => a.map(qw).join(' ')
const ring = (cx, cy, rx, ry, n = 18) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * 2 * Math.PI
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]
})

/* prisma: footprint poligon bebas, hanya sisi yang menghadap kamera digambar */
function prism(poly, z0, z1, o = {}) {
  const n = poly.length, col = o.color, st = col || 'var(--wire)'
  let A = 0
  for (let i = 0; i < n; i++) {
    const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % n]
    A += x0 * y1 - x1 * y0
  }
  const B = poly.map(([x, y]) => P(x, y, z0)), Tp = poly.map(([x, y]) => P(x, y, z1))
  let fx = '', fy = '', fl = '', lit = ''
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, [x0, y0] = poly[i], [x1, y1] = poly[j], ex = x1 - x0, ey = y1 - y0, nx = A > 0 ? ey : -ey, ny = A > 0 ? -ex : ex
    if (SI * nx + CO * ny <= 0) continue
    const f = `M${q(B[i])}L${q(B[j])}L${q(Tp[j])}L${q(Tp[i])}Z`
    if (CO * nx - SI * ny > 0) fx += f
    else fy += f
    if (z1 - z0 > 1.3 && !o.plain) {
      for (let z = z0 + 0.8; z < z1 - 0.25; z += 0.8) {
        fl += `M${q(P(x0 + ex * 0.03, y0 + ey * 0.03, z))}L${q(P(x1 - ex * 0.03, y1 - ey * 0.03, z))}`
        if (!col && rnd() < 0.3) {
          const t = 0.1 + rnd() * 0.65
          lit += `M${q(P(x0 + ex * t, y0 + ey * t, z + 0.4))}L${q(P(x0 + ex * (t + 0.15), y0 + ey * (t + 0.15), z + 0.4))}`
        }
      }
    }
  }
  const so = col ? 1 : 0.55
  let s = ''
  if (fx) s += `<path d="${fx}" fill="${col || 'var(--bld-x)'}" fill-opacity="${col ? 0.18 : 1}" stroke="${st}" stroke-opacity="${so}" stroke-width=".9" stroke-linejoin="round"/>`
  if (fy) s += `<path d="${fy}" fill="${col || 'var(--bld-y)'}" fill-opacity="${col ? 0.1 : 1}" stroke="${st}" stroke-opacity="${so}" stroke-width=".9" stroke-linejoin="round"/>`
  if (fl) s += `<path d="${fl}" stroke="${st}" stroke-opacity="${col ? 0.5 : 0.22}" stroke-width=".6" fill="none"/>`
  if (lit) s += `<path d="${lit}" stroke="#ffd58a" stroke-opacity=".6" stroke-width="1.5" fill="none"/>`
  return s + `<polygon class="roof" points="${pts(Tp)}" fill="${col || 'var(--bld-top)'}" fill-opacity="${col ? 0.3 : 1}" stroke="${col || 'var(--wire-hi)'}" stroke-opacity="${col ? 1 : 0.5}" stroke-width="${col ? 1.5 : 0.9}" stroke-linejoin="round"/>`
}

/* district = gaya isi kavling (Voronoi berbobot) */
const STY = {
  down: { bw: 4.4, bh: 3.8, g: 1 }, civic: { bw: 5, bh: 4, g: 1.1 }, resid: { bw: 7.4, bh: 3.1, g: 0.9 }, old: { bw: 3.6, bh: 3, g: 0.7 },
  ind: { bw: 8, bh: 5, g: 1.1 }, port: { bw: 7, bh: 3.6, g: 1 }, campus: { bw: 9, bh: 7, g: 1.4 }, park: { bw: 8, bh: 6, g: 1 },
}
const DIST = [
  { c: [4, 0], w: 1.1, st: 'down' }, { c: [-26, -16], w: 0.8, st: 'port' }, { c: [-22, 6], w: 0.7, st: 'old' },
  { c: [-18, 30], w: 0.8, st: 'ind' }, { c: [0, -40], w: 0.8, st: 'civic' }, { c: [20, -40], w: 1, st: 'resid' },
  { c: [32, -8], w: 0.8, st: 'campus' }, { c: [48, -50], w: 0.8, st: 'ind' }, { c: [0, 38], w: 0.55, st: 'park' },
  { c: [16, 18], w: 0.6, st: 'old' }, { c: [16, 52], w: 1.2, st: 'resid' }, { c: [58, 10], w: 1.2, st: 'resid' },
  { c: [-20, 56], w: 1, st: 'resid' }, { c: [64, -50], w: 1, st: 'resid' },
]
const distAt = (x, y) => {
  let b = 0, bd = 1e9
  for (let i = 0; i < DIST.length; i++) {
    const d = DIST[i], v = Math.hypot(x - d.c[0], y - d.c[1]) / d.w
    if (v < bd) {
      bd = v
      b = i
    }
  }
  return b
}

const LANDMARKS = {
  hq: (L) => prism(R(-3.5, -5, 3.5, 1), 0, 1.2, L) + prism(R(-2, -3.9, 2, -0.1), 1.2, 6.5, L) + prism(R(-0.7, -2.6, 0.7, -1.4), 6.5, 7.1, { ...L, plain: true }),
  coding: (L) => prism(R(-18, 14, -12, 18), 0, 1.8, L) + [0, 1, 2].map((i) => prism(R(-17.5 + i * 1.9, 14.6, -16.1 + i * 1.9, 17.4), 1.8, 2.3, { ...L, plain: true })).join(''),
  radio: (L) => {
    const [a, b] = P(16, -29, 6), [c, e] = P(16, -29, 7.6)
    return prism(R(14.5, -30.5, 17.5, -27.5), 0, 1, L) + prism(R(15.4, -29.6, 16.6, -28.4), 1, 6, { ...L, plain: true })
      + `<line x1="${a}" y1="${b}" x2="${c}" y2="${e}" stroke="${L.color}" stroke-width="2"/><circle cx="${c}" cy="${e}" r="3.5" fill="${L.color}" class="beacon" filter="url(#glow)"/>`
  },
  investigate: (L) => prism(R(29, -4, 35, 0), 0, 2.2, L) + prism(R(30, -3.3, 34, -0.7), 2.2, 2.6, { ...L, plain: true }) + prism(R(30.5, 0, 33.5, 0.7), 0, 1.7, { ...L, plain: true }),
  standby: (L) => prism(R(12.5, 13.5, 19.5, 16.5), 0, 1.2, L) + prism(R(13, 16.5, 19, 18), 0.95, 1.15, { ...L, plain: true }),
  dock: (L) => {
    const c = coastX(-8), p = { ...L, plain: true }
    let s = prism(R(-37, -11, -33, -5), 0, 1.1, L)
    for (const x of [c - 1.4, c - 3.6]) for (const y of [-8.75, -7.5]) s += prism(R(x - 0.25, y, x, y + 0.25), 0, 2.8, p)
    return s + prism(R(c - 3, -8.45, c - 2.2, -7.55), 2.2, 2.8, p) + prism(R(c - 7.8, -8.8, c + 1, -7.2), 2.8, 3.2, p)
  },
}

export function renderCity() {
  seed = 23
  const ground = [], items = [], trees = []
  const vis = (x, y, m = 0) => {
    const [a, b] = P(x, y)
    return Math.abs(a) < 700 + m && b > -480 - m && b < 440 + m
  }
  const depthOf = (poly) => {
    let x = 0, y = 0
    for (const p of poly) {
      x += p[0]
      y += p[1]
    }
    return (SI * x + CO * y) / poly.length
  }
  const add = (poly, z0, z1, o = {}) => items.push([depthOf(poly), prism(poly, z0, z1, o)])

  // jalan + rel disampel ke hash, supaya kavling tidak menimpa jalan
  const HS = 4, hash = {}
  const put = (x, y, w) => (hash[Math.floor(x / HS) + ',' + Math.floor(y / HS)] ??= []).push([x, y, w])
  for (const [a, b, w] of ROADS) for (const [x, y] of EDGE[a + '>' + b].p) put(x, y, w / 2)
  const [r0, r1] = RAIL
  for (let x = r0[0]; x < r1[0]; x += 0.6) put(x, r0[1], 1)
  const EXCL = [
    ...Object.values(LOCS).map((L) => {
      const [x0, y0, x1, y1] = L.foot
      return [L.cx, L.cy, Math.hypot(x1 - x0, y1 - y0) / 2 + 1.4]
    }),
    [0, -38, 7], [32, -16, 3.6], [47, -45.7, 6], [0, 34, 6.2],
  ]

  function free(cx, cy, hw, hh) {
    for (const [u, v] of [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]]) if (inSea(cx + u, cy + v, 1.2)) return false
    for (const [ex, ey, r] of EXCL) if (Math.hypot(Math.max(0, Math.abs(ex - cx) - hw), Math.max(0, Math.abs(ey - cy) - hh)) < r) return false
    const rr = Math.max(hw, hh) + 2.5
    for (let i = Math.floor((cx - rr) / HS); i <= Math.floor((cx + rr) / HS); i++) {
      for (let j = Math.floor((cy - rr) / HS); j <= Math.floor((cy + rr) / HS); j++) {
        for (const [x, y, w] of hash[i + ',' + j] || []) if (Math.abs(x - cx) < hw + w + 0.25 && Math.abs(y - cy) < hh + w + 0.25) return false
      }
    }
    return true
  }
  function place(cx, cy, hw, hh, d, lvl) {
    if (free(cx, cy, hw, hh)) {
      fill(cx, cy, hw, hh, d)
      return
    }
    if (lvl >= 3) return
    const nu = hw > 1.3 ? 2 : 1, nv = hh > 1.3 ? 2 : 1
    if (nu * nv === 1) return
    const nhw = nu > 1 ? (hw - 0.25) / 2 : hw, nhh = nv > 1 ? (hh - 0.25) / 2 : hh
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) place(cx + (nu > 1 ? (i ? 1 : -1) * (nhw + 0.25) : 0), cy + (nv > 1 ? (j ? 1 : -1) * (nhh + 0.25) : 0), nhw, nhh, d, lvl + 1)
  }
  function fill(cx, cy, hw, hh, d) {
    const Rl = (u0, v0, u1, v1) => R(cx + u0, cy + v0, cx + u1, cy + v1)
    const pad = (cls) => ground.push(`<polygon class="${cls}" points="${ptsW(Rl(-hw, -hh, hw, hh))}"/>`)
    const treesIn = (n) => {
      for (let i = 0; i < n; i++) trees.push([cx + (rnd() * 2 - 1) * (hw - 0.5), cy + (rnd() * 2 - 1) * (hh - 0.5)])
    }
    const st = d.st, r = rnd()
    if (st === 'park' || (st === 'resid' && r < 0.06) || (st === 'civic' && r < 0.3) || (st === 'campus' && r < 0.15)) {
      pad('park')
      treesIn(Math.round(hw * hh * 0.9))
      if (st === 'park' && r < 0.2) add(Rl(-0.8, -0.8, 0.8, 0.8), 0, 0.7)
      return
    }
    pad(st === 'campus' ? 'lawn' : 'pad')
    if (st === 'resid') {
      const rows = hh * 2 >= 2.4 ? 2 : 1, rh = (hh * 2) / rows, n = Math.max(1, Math.round((hw * 2) / 1.3)), cw = (hw * 2) / n
      for (let k = 0; k < rows; k++) {
        for (let i = 0; i < n; i++) {
          if (rnd() < 0.07) continue
          const u0 = -hw + i * cw + 0.12, v0 = -hh + k * rh + 0.16
          add(Rl(u0, v0, u0 + cw - 0.24, v0 + rh - 0.32), 0, 0.5 + rnd() * 0.35)
        }
      }
    } else if (st === 'down' || st === 'civic') {
      const f = st === 'down' ? Math.max(0, 1 - Math.hypot(cx, cy) / 18) : 0
      const hg = () => (st === 'down' ? 1.4 + rnd() * 1.8 + f * rnd() * 5 : 0.9 + rnd() * 1.3), m = 0.3, rr = rnd()
      if (rr < 0.3) add(Rl(-hw + m, -hh + m, hw - m, hh - m), 0, hg())
      else if (rr < 0.6) {
        add(Rl(-hw + m, -hh + m, -m / 2, hh - m), 0, hg())
        add(Rl(m / 2, -hh + m, hw - m, hh - m), 0, hg())
      } else {
        for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          if (rnd() < 0.15) continue
          const u0 = a < 0 ? -hw + m : m / 2, v0 = b < 0 ? -hh + m : m / 2
          add(Rl(u0, v0, u0 + hw - m * 1.5, v0 + hh - m * 1.5), 0, hg())
        }
      }
    } else if (st === 'old') {
      let u = -hw + 0.15
      while (u < hw - 0.6) {
        const w = Math.min(hw - 0.15 - u, 0.9 + rnd() * 1.3)
        if (rnd() < 0.9) add(Rl(u, -hh + 0.15 + rnd() * 0.3, u + w - 0.15, hh - 0.15 - rnd() * 0.3), 0, 0.7 + rnd())
        u += w
      }
    } else if (st === 'ind') {
      if (hw > 2 && hh > 1.6 && rnd() < 0.3) {
        add(Rl(-hw + 0.4, -hh + 0.4, hw * 0.2, hh - 0.4), 0, 1 + rnd() * 0.5)
        for (const b of [-0.45, 0.45]) add(ring(cx + hw * 0.58, cy + hh * b, 0.8, 0.8, 10), 0, 1.3, { plain: true })
      } else if (hh > 1.6 && rnd() < 0.5) {
        add(Rl(-hw + 0.4, -hh + 0.4, hw - 0.4, -0.2), 0, 1 + rnd() * 0.6)
        add(Rl(-hw + 0.4, 0.2, hw - 0.4, hh - 0.4), 0, 0.9 + rnd() * 0.5)
      } else add(Rl(-hw + 0.4, -hh + 0.4, hw - 0.4, hh - 0.4), 0, 1.1 + rnd() * 0.6)
    } else if (st === 'port') {
      if (rnd() < 0.6) {
        for (let v = -hh + 0.4; v < hh - 0.6; v += 0.8) for (let u = -hw + 0.4; u < hw - 1.4; u += 1.6) if (rnd() > 0.2) add(Rl(u, v, u + 1.4, v + 0.55), 0, rnd() < 0.3 ? 0.9 : 0.45, { plain: true })
      } else add(Rl(-hw + 0.5, -hh + 0.5, hw - 0.5, hh - 0.5), 0, 0.9 + rnd() * 0.4)
    } else if (st === 'campus') {
      const m = 0.5, t = 1.3, h = 1.5 + rnd() * 0.9
      if (rnd() < 0.6) {
        add(Rl(-hw + m, -hh + m, hw - m, -hh + m + t), 0, h)
        add(Rl(-hw + m, -hh + m + t + 0.2, -hw + m + t, hh - m), 0, h)
        add(Rl(hw - m - t, -hh + m + t + 0.2, hw - m, hh - m), 0, h)
        treesIn(4)
      } else {
        add(Rl(-hw + m, -hh + m, hw - m, -hh + m + t * 1.2), 0, h)
        add(Rl(-hw + m, hh - m - t * 1.2, hw - m, hh - m), 0, h * 0.8)
        treesIn(3)
      }
    }
  }

  // isi tiap blok grid: kavling dipasang rata mengikuti batas blok
  for (let j = 0; j + 1 < YS.length; j++) {
    const ya = YS[j], yb = YS[j + 1]
    for (let i = -1; i + 1 < XS.length; i++) {
      const xa = XS[i], xb = XS[i + 1]
      const x0 = (i < 0 ? Math.min(crx(ya), crx(yb)) : Math.max(gx(xa, ya), gx(xa, yb))) + 1, x1 = Math.min(gx(xb, ya), gx(xb, yb)) - 1
      const y0 = Math.max(gy(xb, ya), i < 0 ? -1e9 : gy(xa, ya)) + 1, y1 = Math.min(gy(xb, yb), i < 0 ? 1e9 : gy(xa, yb)) - 1
      if (x1 - x0 < 2 || y1 - y0 < 2 || !vis((x0 + x1) / 2, (y0 + y1) / 2, 120)) continue
      const d = DIST[distAt((x0 + x1) / 2, (y0 + y1) / 2)], st = STY[d.st], W = x1 - x0, H = y1 - y0
      const nu = Math.max(1, Math.round((W + st.g) / (st.bw + st.g))), nv = Math.max(1, Math.round((H + st.g) / (st.bh + st.g)))
      const lw = (W - (nu - 1) * st.g) / nu, lh = (H - (nv - 1) * st.g) / nv
      for (let a = 0; a < nu; a++) {
        for (let b = 0; b < nv; b++) {
          const cx = x0 + a * (lw + st.g) + lw / 2, cy = y0 + b * (lh + st.g) + lh / 2
          if (vis(cx, cy, 40)) place(cx, cy, lw / 2, lh / 2, d, 0)
        }
      }
    }
  }

  // landmark: stadion, kubah kampus, stasiun, kapal
  {
    let s = prism(ring(0, -38, 5.5, 4.5, 22), 0, 1.5, { plain: true })
    s += `<polygon points="${pts(ring(0, -38, 3.8, 2.8, 22).map((p) => P(p[0], p[1], 1.5)))}" fill="#0b1e1a" stroke="#3a8a6c" stroke-width="1"/>`
    s += `<polygon points="${pts(R(-2, -39.4, 2, -36.6).map((p) => P(p[0], p[1], 1.5)))}" fill="none" stroke="#3a8a6c" stroke-opacity=".7" stroke-width=".8"/>`
    for (const [x, y] of ring(0, -38, 6, 5, 4)) {
      const [a, b] = P(x, y, 0), [c, e] = P(x, y, 3.4)
      s += `<line x1="${a}" y1="${b}" x2="${c}" y2="${e}" stroke="var(--wire-hi)" stroke-opacity=".6"/><circle cx="${c}" cy="${e}" r="1.6" fill="#ffd58a"/>`
    }
    items.push([CO * -38, s])
  }
  {
    let s = prism(ring(32, -16, 2.7, 2.7, 16), 0, 0.6, { plain: true })
    for (let k = 0; k < 4; k++) {
      const f = (a) => 2.4 * Math.cos(a), a0 = (k * Math.PI) / 8, a1 = ((k + 1) * Math.PI) / 8
      s += prism(ring(32, -16, f(a0), f(a0), 16), 0.6 + 2.2 * Math.sin(a0), 0.6 + 2.2 * Math.sin(a1), { plain: true })
    }
    items.push([SI * 32 + CO * -16, s])
  }
  ground.push(`<polygon class="pad" points="${ptsW(R(41, -47.8, 53, -44))}"/>`)
  items.push([SI * 47 + CO * -45.7, prism(R(42, -46.6, 52, -44.6), 0, 1.4) + prism(R(45, -46.2, 49, -45), 1.4, 2.2) + prism(R(41.5, -47.5, 52.5, -46.7), 1, 1.15, { plain: true })])
  for (const [y, len] of [[-12, 6], [-3.5, 5]]) {
    const x0 = coastX(y) - 2.2, x1 = x0 - len
    items.push([-99, prism([[x0, y - 0.7], [x0, y + 0.7], [x1, y + 0.7], [x1 - 1.2, y], [x1, y - 0.7]], 0, 0.6, { plain: true }) + prism(R(x0 - 1.8, y - 0.5, x0 - 0.5, y + 0.5), 0.6, 1.5, { plain: true })])
  }

  // gedung kerja
  for (const [k, L] of Object.entries(LOCS)) items.push([SI * L.cx + CO * L.cy, `<g id="lm-${k}">${LANDMARKS[k]({ color: L.color })}</g>`])

  // lapisan tanah (koordinat dunia, diproyeksikan lewat matrix)
  let g = ''
  const coast = []
  for (let y = -200; y <= 200; y += 2) coast.push([coastX(y), y])
  g += `<polygon points="${ptsW([...coast, [-400, 200], [-400, -200]])}" fill="var(--water)"/>`
  g += `<path d="M${coast.map(qw).join('L')}" stroke="var(--wire-hi)" stroke-opacity=".5" stroke-width=".2" fill="none"/>`
  g += `<path d="M${coast.map(([x, y]) => qw([x - 1.8, y])).join('L')}" stroke="var(--wire)" stroke-opacity=".4" stroke-width=".12" stroke-dasharray=".6 .8" fill="none"/>`
  let wv = ''
  for (let i = 0; i < 320; i++) {
    const y = -90 + rnd() * 190, x = coastX(y) - 3 - rnd() * 40
    if (vis(x, y)) wv += `M${qw([x, y])}L${qw([x, y + 1.4])}`
  }
  g += `<path d="${wv}" stroke="#2f5f8f" stroke-opacity=".6" stroke-width=".13" fill="none"/>`
  for (const y of [-16, -8, 0]) {
    const c = coastX(y)
    g += `<polygon class="pier" points="${ptsW(R(c - 8, y - 0.8, c + 1.5, y + 0.8))}"/>`
  }
  g += `<ellipse cx="0" cy="34" rx="5" ry="3.5" fill="var(--water)" stroke="var(--wire-hi)" stroke-opacity=".5" stroke-width=".15"/><path d="M-3 33.5h2M1 35h2.2M-1 36h1.4" stroke="#2f5f8f" stroke-width=".13"/>`
  g += ground.join('')
  let rc = '', rf = '', rm = ''
  for (const [a, b, w, c1, c2] of ROADS) {
    const d = `M${qw(NODES[a])}C${qw(c1)} ${qw(c2)} ${qw(NODES[b])}`
    rc += `<path d="${d}" stroke-width="${w + 0.45}"/>`
    rf += `<path d="${d}" stroke-width="${w}"/>`
    if (w >= 1.3) rm += d
  }
  g += `<g fill="none" stroke="#4d77a0" stroke-linecap="round" stroke-linejoin="round">${rc}</g><g fill="none" stroke="var(--road)" stroke-linecap="round">${rf}</g>`
  g += `<path d="${rm}" fill="none" stroke="#e0bb62" stroke-opacity=".6" stroke-width=".13" stroke-dasharray=".8 1"/>`
  const rd = `M${qw(r0)}L${qw(r1)}`
  g += `<path d="${rd}" stroke="#0a1120" stroke-width="1.7"/><path d="${rd}" stroke="#5f7fa3" stroke-width="1.1" stroke-dasharray=".14 .45"/><path d="M${qw([r0[0], r0[1] - 0.3])}L${qw([r1[0], r1[1] - 0.3])}M${qw([r0[0], r0[1] + 0.3])}L${qw([r1[0], r1[1] + 0.3])}" stroke="var(--wire-hi)" stroke-opacity=".7" stroke-width=".09"/>`
  g += trees.map((p) => `<circle class="tree" cx="${p[0].toFixed(2)}" cy="${p[1].toFixed(2)}" r="${(0.38 + rnd() * 0.2).toFixed(2)}"/>`).join('')

  // lampu jalan di sepanjang jalan
  let lamps = ''
  for (const [a, b, w] of ROADS) {
    if (w < 1) continue
    const p = EDGE[a + '>' + b].p
    for (let i = 6; i < p.length - 3; i += 12) {
      const [x0, y0] = p[i - 1], [x1, y1] = p[i + 1], l = Math.hypot(x1 - x0, y1 - y0) || 1, side = i % 24 < 12 ? 1 : -1
      const x = p[i][0] - ((y1 - y0) / l) * (w / 2 + 0.35) * side, y = p[i][1] + ((x1 - x0) / l) * (w / 2 + 0.35) * side
      if (!vis(x, y)) continue
      const [sx, sy] = P(x, y)
      lamps += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="4" fill="#ffd58a" opacity=".08"/><circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="1.1" fill="#ffd58a" opacity=".85"/>`
    }
  }

  items.sort((a, b) => a[0] - b[0])
  return `<rect x="-3000" y="-3000" width="6000" height="6000" fill="var(--ground)"/><g transform="${GROUND}">${g}</g>${lamps}${items.map((i) => i[1]).join('')}`
}

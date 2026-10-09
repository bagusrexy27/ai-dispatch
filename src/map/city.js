import { CO, SI, P, GROUND, q, pts, R, coastX, inSea, crx, XS, YS, ART_X, ART_Y, gx, gy, ROADS, NODES, EDGE, RAIL, LOCS } from './geometry.js'

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
  // color = transparan berwarna (khusus lokasi tujuan agent); tint = gedung solid, garis tepi berwarna
  const n = poly.length, col = o.color, st = col || o.tint || 'var(--wire)'
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
  const so = col ? 1 : o.tint ? 0.8 : 0.55
  let s = ''
  if (fx) s += `<path d="${fx}" fill="${col || 'var(--bld-x)'}" fill-opacity="${col ? 0.18 : 1}" stroke="${st}" stroke-opacity="${so}" stroke-width=".9" stroke-linejoin="round"/>`
  if (fy) s += `<path d="${fy}" fill="${col || 'var(--bld-y)'}" fill-opacity="${col ? 0.1 : 1}" stroke="${st}" stroke-opacity="${so}" stroke-width=".9" stroke-linejoin="round"/>`
  if (fl) s += `<path d="${fl}" stroke="${st}" stroke-opacity="${col ? 0.5 : 0.22}" stroke-width=".6" fill="none"/>`
  if (lit) s += `<path d="${lit}" stroke="#ffd58a" stroke-opacity=".6" stroke-width="1.5" fill="none"/>`
  return s + `<polygon class="roof" points="${pts(Tp)}" fill="${col || 'var(--bld-top)'}" fill-opacity="${col ? 0.3 : 1}" stroke="${col || o.tint || 'var(--wire-hi)'}" stroke-opacity="${col || o.tint ? 1 : 0.5}" stroke-width="${col ? 1.5 : 0.9}" stroke-linejoin="round"/>`
}

/* district = gaya isi kavling (Voronoi berbobot) */
const STY = {
  // skala: stadion ±13×11, HQ 6.4×5.5 → gedung biasa jauh lebih kecil (kantor ~3)
  cbd: { bw: 4.4, bh: 4, g: 0.9 }, office: { bw: 5, bh: 4.4, g: 1 }, comm: { bw: 5.6, bh: 4.6, g: 1 },
  apt: { bw: 5.2, bh: 4.4, g: 1 }, civic: { bw: 5.2, bh: 4.4, g: 1.1 }, old: { bw: 5, bh: 3.4, g: 0.7 },
  ind: { bw: 7, bh: 5, g: 1.1 }, port: { bw: 6.5, bh: 3.6, g: 0.8 }, campus: { bw: 7.5, bh: 6.5, g: 1.2 },
  park: { bw: 8, bh: 6, g: 1 },
}
/* zonasi pusat kota: CBD di HQ → cincin perkantoran → koridor komersial di arteri (x=8, y=8)
   → apartemen di cincin luar; industri/logistik di pelabuhan & rel; hijau cuma taman danau + kampus */
const DIST = [
  { c: [4, -2], w: 1.5, st: 'cbd' },
  { c: [22, -16], w: 1, st: 'office' }, { c: [38, 6], w: 1, st: 'office' }, { c: [-12, -22], w: 0.8, st: 'office' },
  { c: [10, 26], w: 0.9, st: 'comm' }, { c: [30, 24], w: 0.8, st: 'comm' }, { c: [56, -14], w: 0.9, st: 'comm' },
  { c: [-22, 6], w: 0.6, st: 'old' }, // kota tua: ruko
  { c: [0, -40], w: 0.8, st: 'civic' }, { c: [32, -14], w: 0.45, st: 'campus' }, { c: [0, 36], w: 0.45, st: 'park' }, { c: [28, 38], w: 0.4, st: 'park' }, { c: [56, 30], w: 0.4, st: 'park' },
  { c: [-26, -16], w: 0.8, st: 'port' }, { c: [-18, 32], w: 0.8, st: 'ind' }, { c: [48, -52], w: 0.7, st: 'ind' },
  { c: [22, -56], w: 1, st: 'apt' }, { c: [16, 54], w: 1.1, st: 'apt' }, { c: [62, 14], w: 1.1, st: 'apt' },
  { c: [-18, 58], w: 1, st: 'apt' }, { c: [70, -50], w: 1, st: 'apt' }, { c: [-24, -52], w: 0.8, st: 'apt' },
]
const POCKET = { apt: 0.12, office: 0.07, comm: 0.05, cbd: 0.04, civic: 0.12, campus: 0.15 }
/** 0..1, turun dari pusat CBD (gradien kepadatan/bid-rent) */
const dens = (x, y) => Math.max(0, 1 - Math.hypot(x - 4, y + 2) / 45)
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
  hq: (L) => prism(R(-3.2, -4.6, 3.2, 0.9), 0, 1.1, L) + prism(R(-1.9, -3.6, 1.9, -0.1), 1.1, 5.2, L) + prism(R(-0.65, -2.4, 0.65, -1.3), 5.2, 5.8, { ...L, plain: true }),
  coding: (L) => prism(R(-17.5, 14.2, -12.5, 17.6), 0, 2.1, L) + [0, 1, 2].map((i) => prism(R(-17.1 + i * 1.55, 14.6, -16 + i * 1.55, 17.2), 2.1, 2.8, { ...L, plain: true })).join(''),
  radio: (L) => {
    const [a, b] = P(16, -29, 4.6), [c, e] = P(16, -29, 5.8)
    return prism(R(14.8, -30.2, 17.2, -27.8), 0, 0.9, L) + prism(R(15.5, -29.5, 16.5, -28.5), 0.9, 4.6, { ...L, plain: true })
      + `<line x1="${a}" y1="${b}" x2="${c}" y2="${e}" stroke="${L.color}" stroke-width="2"/><circle cx="${c}" cy="${e}" r="3" fill="${L.color}" class="beacon" filter="url(#glow)"/>`
  },
  investigate: (L) => prism(R(29.2, -3.6, 34.6, -0.2), 0, 2.5, L) + prism(R(30, -3, 33.8, -0.8), 2.5, 3.1, { ...L, plain: true }) + prism(R(30.6, -0.2, 33.4, 0.55), 0, 1.9, { ...L, plain: true }),
  standby: (L) => prism(R(13, 13.8, 19, 16.2), 0, 1.7, L) + prism(R(13.4, 16.2, 18.6, 17.6), 1.35, 1.7, { ...L, plain: true }),
  dock: (L) => {
    const c = coastX(-8), p = { ...L, plain: true }
    let s = prism(R(-36.5, -10.5, -33.2, -5.2), 0, 1.25, L)
    for (const x of [c - 1.4, c - 3.6]) for (const y of [-8.75, -7.5]) s += prism(R(x - 0.25, y, x, y + 0.25), 0, 2.4, p)
    return s + prism(R(c - 3, -8.45, c - 2.2, -7.55), 2.0, 2.5, p) + prism(R(c - 7.8, -8.8, c + 1, -7.2), 2.5, 2.9, p)
  },
}

/* casing jalan digambar w + 2·CASING; gedung harus di luar tepi visual ini */
export const CASING = 0.225
/** footprint semua gedung render terakhir (dipakai test anti-tumpang jalan) */
export const FOOT = []

export function renderCity() {
  seed = 23
  FOOT.length = 0
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
  const add = (poly, z0, z1, o = {}) => {
    FOOT.push(poly)
    items.push([depthOf(poly), prism(poly, z0, z1, o)])
  }

  // jalan + rel disampel ke hash, supaya kavling tidak menimpa jalan
  const HS = 4, hash = {}
  const put = (x, y, w) => (hash[Math.floor(x / HS) + ',' + Math.floor(y / HS)] ??= []).push([x, y, w])
  for (const [a, b, w] of ROADS) for (const [x, y] of EDGE[a + '>' + b].p) put(x, y, w / 2 + CASING)
  const [r0, r1] = RAIL
  for (let x = r0[0]; x < r1[0]; x += 0.6) put(x, r0[1], 1)
  // lokasi tujuan agent: pelataran persegi pas footprint, bukan lingkaran besar yang mengosongkan blok
  const LREC = Object.values(LOCS).map(({ foot: [x0, y0, x1, y1] }) => [x0 - 1.2, y0 - 1.2, x1 + 1.2, y1 + 1.2])
  const EXCL = [
    [0, -38, 8], [32, -16, 3.6], [47, -45.7, 6], [0, 34, 6.2],
  ]

  const inExcl = (x, y) => EXCL.some(([ex, ey, r]) => Math.hypot(x - ex, y - ey) < r - 0.8) || LREC.some(([a, b, c, e]) => x > a && x < c && y > b && y < e)
  const nearRoad = (x, y, m) => {
    const i0 = Math.floor(x / HS), j0 = Math.floor(y / HS)
    for (let i = i0 - 1; i <= i0 + 1; i++) {
      for (let j = j0 - 1; j <= j0 + 1; j++) {
        for (const [px, py, w] of hash[i + ',' + j] || []) if (Math.hypot(px - x, py - y) < w + m) return true
      }
    }
    return false
  }
  const plantIn = (cx, cy, hw, hh, n) => {
    for (let i = 0; i < n; i++) {
      const x = cx + (rnd() * 2 - 1) * Math.max(0.1, hw - 0.4), y = cy + (rnd() * 2 - 1) * Math.max(0.1, hh - 0.4)
      if (!inExcl(x, y) && !nearRoad(x, y, 0.35)) trees.push([x, y])
    }
  }

  /** '' kalau kavling bebas; selain itu alasan bentrok. */
  let hit = null // persegi penghalang terakhir (jalan / pelataran lokasi / kavling lain) dari blocked()
  const taken = [] // kavling yang sudah diisi; blok bertetangga bisa berebut area di jalan belok
  function blocked(cx, cy, hw, hh) {
    for (const [u, v] of [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]]) if (inSea(cx + u, cy + v, 1.2)) return 'sea'
    // hash w = setengah lebar visual (aspal + casing); margin tipis = trotoar
    const margin = 0.1
    const rr = Math.max(hw, hh) + 2.5
    for (let i = Math.floor((cx - rr) / HS); i <= Math.floor((cx + rr) / HS); i++) {
      for (let j = Math.floor((cy - rr) / HS); j <= Math.floor((cy + rr) / HS); j++) {
        for (const [x, y, w] of hash[i + ',' + j] || []) {
          if (Math.abs(x - cx) < hw + w + margin && Math.abs(y - cy) < hh + w + margin) {
            hit = [x - w - margin, y - w - margin, x + w + margin, y + w + margin]
            return 'cut'
          }
        }
      }
    }
    for (const r of [...LREC, ...taken]) {
      if (cx + hw > r[0] && cx - hw < r[2] && cy + hh > r[1] && cy - hh < r[3]) {
        hit = [r[0] - 0.2, r[1] - 0.2, r[2] + 0.2, r[3] + 0.2]
        return 'cut'
      }
    }
    for (const [ex, ey, r] of EXCL) if (Math.hypot(Math.max(0, Math.abs(ex - cx) - hw), Math.max(0, Math.abs(ey - cy) - hh)) < r) return 'excl'
    return ''
  }
  function place(cx, cy, hw, hh, d, lvl) {
    const why = blocked(cx, cy, hw, hh)
    if (!why) {
      taken.push([cx - hw, cy - hh, cx + hw, cy + hh])
      fill(cx, cy, hw, hh, d)
      return
    }
    // kena jalan / pelataran lokasi: potong kavling di sisi penghalang (kiri+kanan atau atas+bawah,
    // pilih yang luasnya terbesar) — bukan dibelah dua terus sampai jadi serpihan kosong
    if (why === 'cut') {
      if (lvl >= 8) return
      const x0 = cx - hw, y0 = cy - hh, x1 = cx + hw, y1 = cy + hh, [a, b, c, e] = hit.map((v, i) => v + (i < 2 ? -0.02 : 0.02))
      const ok = ([p, q, r, t]) => r - p >= 2.2 && t - q >= 1.9
      const area = (rs) => rs.reduce((s, [p, q, r, t]) => s + (r - p) * (t - q), 0)
      const lr = [[x0, y0, Math.min(x1, a), y1], [Math.max(x0, c), y0, x1, y1]].filter(ok)
      const tb = [[x0, y0, x1, Math.min(y1, b)], [x0, Math.max(y0, e), x1, y1]].filter(ok)
      for (const [p, q, r, t] of area(lr) >= area(tb) ? lr : tb) place((p + r) / 2, (q + t) / 2, (r - p) / 2, (t - q) / 2, d, lvl + 1)
      return
    }
    // sisa kavling di sekeliling landmark jadi pelataran (hardscape), bukan gedung mini berjubel
    if (why === 'excl' && lvl >= 1) {
      // kecuali di district taman (sekitar danau): tetap rumput
      if (d.st === 'park') ground.push(`<polygon class="park" points="${ptsW(R(cx - hw, cy - hh, cx + hw, cy + hh))}"/>`)
      plantIn(cx, cy, hw, hh, Math.round(hw * hh * (d.st === 'park' ? 0.35 : 0.12)))
      return
    }
    if (lvl >= 4) return
    const nu = hw > 1.3 ? 2 : 1, nv = hh > 1.3 ? 2 : 1
    if (nu * nv === 1) return
    const nhw = nu > 1 ? (hw - 0.25) / 2 : hw, nhh = nv > 1 ? (hh - 0.25) / 2 : hh
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) place(cx + (nu > 1 ? (i ? 1 : -1) * (nhw + 0.25) : 0), cy + (nv > 1 ? (j ? 1 : -1) * (nhh + 0.25) : 0), nhw, nhh, d, lvl + 1)
  }
  /** Ganti kavling generic (sudah lolos blocked()) — jangan taruh di jalan. */
  const UNIQUES = [
    { x: -20, y: -32, r: 5, min: 1.4, kind: 'clock' },
    { x: 28, y: -32, r: 5, min: 1.5, kind: 'atrium' },
    { x: -24, y: 32, r: 5.5, min: 1.6, kind: 'datacenter' },
    { x: 48, y: 16, r: 5.5, min: 1.5, kind: 'twin' },
    { x: -28, y: -2, r: 4.5, min: 1.3, kind: 'helipad' },
    { x: 4, y: 40, r: 5, min: 1.5, kind: 'boathouse' },
  ]
  const usedUnique = new Set()
  const uniqueRects = []

  function fillUnique(kind, cx, cy, hw, hh, Rl) {
    if (kind === 'clock') {
      const col = { tint: '#7eb8e8' }
      const shaft = Math.min(4.2, 1.8 + hw * 0.55)
      add(Rl(-hw + 0.25, -hh + 0.25, hw - 0.25, hh - 0.25), 0, 1.0, col)
      add(Rl(-hw * 0.4, -hh * 0.4, hw * 0.4, hh * 0.4), 1.0, shaft, col)
      add(Rl(-hw * 0.25, -hh * 0.25, hw * 0.25, hh * 0.25), shaft, shaft + 0.45, { ...col, plain: true })
      const top = shaft + 0.55
      const [ax, ay] = P(cx, cy, top), [bx, by] = P(cx, cy, top + 0.55)
      items.push([SI * cx + CO * cy, `<circle cx="${ax}" cy="${ay}" r="4.2" fill="var(--panel)" stroke="#7eb8e8" stroke-width="1.5"/><line x1="${ax}" y1="${ay}" x2="${ax + 2.4}" y2="${ay - 0.8}" stroke="#ffd58a" stroke-width="1.3" stroke-linecap="round"/><line x1="${ax}" y1="${ay}" x2="${ax}" y2="${ay - 2.8}" stroke="#e8f0ff" stroke-width="1" stroke-linecap="round"/><circle cx="${bx}" cy="${by}" r="1" fill="#ffd58a"/>`])
      return
    }
    if (kind === 'atrium') {
      const col = { tint: '#9ad4c2' }, m = 0.25
      add(Rl(-hw + m, -hh + m, hw - m, hh - m), 0, 0.45, col)
      add(Rl(-hw + m, -hh + m, -hw * 0.15, hh - m), 0.45, 2.3, col)
      add(Rl(hw * 0.15, -hh + m, hw - m, hh - m), 0.45, 2.3, col)
      add(Rl(-hw + m, -hh + m, hw - m, -hh * 0.35), 0.45, 1.05, { ...col, plain: true })
      add(Rl(-hw + m, hh * 0.35, hw - m, hh - m), 0.45, 1.05, { ...col, plain: true })
      const roof = [P(cx - hw * 0.7, cy - hh * 0.7, 2.35), P(cx + hw * 0.7, cy - hh * 0.7, 2.35), P(cx + hw * 0.7, cy + hh * 0.7, 1.35), P(cx - hw * 0.7, cy + hh * 0.7, 1.35)]
      items.push([SI * cx + CO * cy, `<polygon points="${pts(roof)}" fill="var(--bld-top)" stroke="#9ad4c2" stroke-width="1.2"/>`])
      return
    }
    if (kind === 'datacenter') {
      const col = { tint: '#8aa4d4' }, m = 0.3
      add(Rl(-hw + m, -hh + m, hw * 0.15, hh - m), 0, 1.7, col)
      add(Rl(-hw + m, -hh + m, hw * 0.15, hh - m), 1.7, 2.3, { ...col, plain: true })
      for (const [ux, uy] of [[0.45, -0.4], [0.45, 0.4]]) {
        add(ring(cx + hw * ux, cy + hh * uy, Math.min(0.9, hw * 0.28), Math.min(0.9, hh * 0.28), 10), 0, 2.7, { ...col, plain: true })
        const [tx, ty] = P(cx + hw * ux, cy + hh * uy, 3)
        items.push([SI * cx + CO * cy, `<circle cx="${tx}" cy="${ty}" r="2" fill="none" stroke="#8aa4d4" stroke-width="1" stroke-dasharray="2 2" opacity=".7"/>`])
      }
      const [dx, dy] = P(cx - hw * 0.2, cy, 2.5), [ex, ey] = P(cx - hw * 0.2, cy, 3.3)
      items.push([SI * cx + CO * cy, `<line x1="${dx}" y1="${dy}" x2="${ex}" y2="${ey}" stroke="#8aa4d4" stroke-width="1.5"/><ellipse cx="${ex}" cy="${ey}" rx="4" ry="2.2" fill="none" stroke="#ffd58a" stroke-width="1.2"/>`])
      return
    }
    if (kind === 'twin') {
      const col = { tint: '#d4a574' }, m = 0.28
      add(Rl(-hw + m, -hh + m, hw - m, hh - m), 0, 0.5, col)
      add(Rl(-hw + m, -hh + m, -0.15, hh - m), 0.5, 3.6, col)
      add(Rl(0.15, -hh + m, hw - m, hh - m), 0.5, 4.2, col)
      add(Rl(-hw + m + 0.15, -hh + m + 0.15, -0.3, hh - m - 0.15), 3.6, 3.95, { ...col, plain: true })
      add(Rl(0.3, -hh + m + 0.15, hw - m - 0.15, hh - m - 0.15), 4.2, 4.55, { ...col, plain: true })
      add(Rl(-0.2, -hh * 0.2, 0.2, hh * 0.2), 2.5, 2.9, { ...col, plain: true })
      const [lx, ly] = P(cx + hw * 0.4, cy, 4.8)
      items.push([SI * cx + CO * cy, `<circle cx="${lx}" cy="${ly}" r="1.6" fill="#ffd58a" opacity=".85"/>`])
      return
    }
    if (kind === 'helipad') {
      const col = { tint: '#c9d4e8' }, m = 0.2
      add(Rl(-hw + m, -hh + m, hw - m, hh - m), 0, 0.35, col)
      add(Rl(-hw + m + 0.15, -hh + m + 0.15, hw - m - 0.15, hh - m - 0.15), 0.35, 0.52, { ...col, plain: true })
      const rr = Math.min(hw, hh) * 0.55
      const ringPts = ring(cx, cy, rr, rr, 16).map((p) => P(p[0], p[1], 0.54))
      const [h1, h2] = [P(cx - rr * 0.55, cy, 0.56), P(cx + rr * 0.55, cy, 0.56)]
      const [v1, v2] = [P(cx, cy - rr * 0.55, 0.56), P(cx, cy + rr * 0.55, 0.56)]
      items.push([SI * cx + CO * cy, `<polygon points="${pts(ringPts)}" fill="none" stroke="#c9d4e8" stroke-width="1.4"/><line x1="${h1[0]}" y1="${h1[1]}" x2="${h2[0]}" y2="${h2[1]}" stroke="#ffd58a" stroke-width="2.2" stroke-linecap="round"/><line x1="${v1[0]}" y1="${v1[1]}" x2="${v2[0]}" y2="${v2[1]}" stroke="#ffd58a" stroke-width="2.2" stroke-linecap="round"/>`])
      return
    }
    if (kind === 'boathouse') {
      // Rumah perahu sederhana di tepi danau — bukan gazebo kerucut
      const col = { tint: '#6bb89a' }, m = 0.28
      add(Rl(-hw + m, -hh + m, hw - m, hh * 0.15), 0, 0.35, { ...col, plain: true })
      add(Rl(-hw + m, -hh * 0.35, hw - m, hh - m), 0, 1.35, col)
      add(Rl(-hw * 0.55, -hh * 0.2, hw * 0.55, hh - m - 0.1), 1.35, 1.85, { ...col, plain: true })
      // dermaga pendek ke arah danau (utara lokal)
      add(Rl(-hw * 0.2, -hh + m - 0.15, hw * 0.2, -hh * 0.5), 0, 0.25, { ...col, plain: true })
    }
  }

  function fill(cx, cy, hw, hh, d) {
    const Rl = (u0, v0, u1, v1) => R(cx + u0, cy + v0, cx + u1, cy + v1)
    const pad = (cls) => ground.push(`<polygon class="${cls}" points="${ptsW(Rl(-hw, -hh, hw, hh))}"/>`)
    const treesIn = (n) => {
      for (let i = 0; i < n; i++) trees.push([cx + (rnd() * 2 - 1) * (hw - 0.5), cy + (rnd() * 2 - 1) * (hh - 0.5)])
    }
    const st = d.st, r = rnd()

    // kavling sisa terlalu kecil untuk gedung yang proporsional → pelataran
    if (hw < 1.1 || hh < 0.95) {
      pad('pad')
      if (rnd() < 0.4) plantIn(cx, cy, hw, hh, 1)
      return
    }

    const u = UNIQUES.find((q) => !usedUnique.has(q.kind) && Math.hypot(cx - q.x, cy - q.y) < q.r && hw >= q.min && hh >= q.min * 0.75)
    if (u) {
      usedUnique.add(u.kind)
      uniqueRects.push([cx - hw, cy - hh, cx + hw, cy + hh])
      pad(u.kind === 'boathouse' ? 'park' : 'pad')
      fillUnique(u.kind, cx, cy, hw, hh, Rl)
      return
    }

    // taman saku: secukupnya, makin jarang ke arah CBD
    if (st === 'park' || r < (POCKET[st] ?? 0)) {
      pad('park')
      treesIn(Math.round(hw * hh * 0.6))
      if (st === 'park' && r < 0.2) add(Rl(-0.8, -0.8, 0.8, 0.8), 0, 0.7)
      return
    }
    // bentuk dasar: lot dipakai sebagian (setback), massa bertingkat, bukan kotak penuh
    // di depan (sisi kamera) lokasi tujuan agent: gedung lebih rendah supaya lokasi & jalannya tidak tertutup
    const low = Object.values(LOCS).some((L) => cy > L.cy && cy - L.cy < 14 && Math.abs(cx - L.cx) < 9) ? 0.5 : 1
    const box = (u0, v0, u1, v1, z0, z1, o) => add(Rl(u0, v0, u1, v1), z0 * low, z1 * low, o)
    // podium + menara mundur + ruang mesin
    const tower = (u0, v0, u1, v1, h) => {
      const w = u1 - u0, dd = v1 - v0, ph = 0.6 + rnd() * 0.3, iu = w * 0.18, iv = dd * 0.18
      box(u0, v0, u1, v1, 0, ph)
      box(u0 + iu, v0 + iv, u1 - iu, v1 - iv, ph, h)
      if (rnd() < 0.6) box(u0 + w * 0.36, v0 + dd * 0.36, u1 - w * 0.36, v1 - dd * 0.36, h, h + 0.3, { plain: true })
    }
    // terasering 3 tingkat
    const stepped = (u0, v0, u1, v1, h) => {
      const w = u1 - u0, dd = v1 - v0
      box(u0, v0, u1, v1, 0, h * 0.45)
      box(u0 + w * 0.12, v0 + dd * 0.2, u1 - w * 0.12, v1, h * 0.45, h * 0.75)
      box(u0 + w * 0.25, v0 + dd * 0.4, u1 - w * 0.25, v1 - dd * 0.05, h * 0.75, h)
    }
    const lshape = (u0, v0, u1, v1, h, t) => {
      box(u0, v0, u1, v0 + t, 0, h)
      box(u0, v0 + t, u0 + t, v1, 0, h * (0.6 + rnd() * 0.3))
    }
    // blok perimeter: 4 sayap mengelilingi courtyard
    const court = (u0, v0, u1, v1, h, t) => {
      box(u0, v0, u1, v0 + t, 0, h)
      box(u0, v0 + t, u0 + t, v1 - t, 0, h)
      box(u1 - t, v0 + t, u1, v1 - t, 0, h)
      box(u0, v1 - t, u1, v1, 0, h)
    }
    // dua menara di atas satu podium
    const twinT = (u0, v0, u1, v1, h) => {
      const w = u1 - u0, mid = (u0 + u1) / 2
      box(u0, v0, u1, v1, 0, 0.7)
      box(u0 + w * 0.06, v0 + 0.25, mid - w * 0.06, v1 - 0.25, 0.7, h)
      box(mid + w * 0.06, v0 + 0.25, u1 - w * 0.06, v1 - 0.25, 0.7, h * (0.75 + rnd() * 0.15))
    }

    pad(st === 'campus' ? 'lawn' : 'pad')
    const D = dens(cx, cy), m = 0.3, u0 = -hw + m, v0 = -hh + m, u1 = hw - m, v1 = hh - m, k = rnd()
    if (st === 'cbd') {
      // inti CBD: menara tertinggi, tetap di bawah HQ (5.8)
      const h = Math.min(5.2, 3 + rnd() * 0.8 + D * 1.8)
      if (k < 0.4) tower(u0, v0, u1, v1, h)
      else if (k < 0.65) stepped(u0, v0, u1, v1, h)
      else if (k < 0.85) twinT(u0, v0, u1, v1, h)
      else lshape(u0, v0, u1, v1, h * 0.85, Math.min(u1 - u0, v1 - v0) * 0.5)
    } else if (st === 'office') {
      // perkantoran: menara sedang, slab, blok courtyard
      const h = Math.min(4.6, 2.2 + rnd() * 0.8 + D * 1.6)
      if (k < 0.35) tower(u0, v0, u1, v1, h)
      else if (k < 0.6) court(u0, v0, u1, v1, h * 0.6, Math.min(1.2, (v1 - v0) * 0.3))
      else if (k < 0.85) {
        box(u0, v0, u1, v1, 0, 0.6)
        box(u0 + 0.2, v0 + (v1 - v0) * 0.3, u1 - 0.2, v1 - (v1 - v0) * 0.3, 0.6, h)
      } else lshape(u0, v0, u1, v1, h * 0.8, Math.min(u1 - u0, v1 - v0) * 0.45)
    } else if (st === 'comm') {
      // komersial: mal, mixed-use (podium toko + menara hunian), deret toko
      if (k < 0.35) {
        const h = 1 + rnd() * 0.4
        box(u0, v0, u1, v1, 0, h)
        box(u0 + (u1 - u0) * 0.3, v0 + (v1 - v0) * 0.25, u1 - (u1 - u0) * 0.3, v1 - (v1 - v0) * 0.25, h, h + 0.5, { plain: true })
      } else if (k < 0.8) {
        const h = Math.min(4.2, 2.4 + rnd() * 0.8 + D), w = (u1 - u0) * 0.4
        box(u0, v0, u1, v1, 0, 0.8)
        box(u1 - w - 0.3, v0 + 0.3, u1 - 0.3, v1 - 0.3, 0.8, h)
      } else {
        let u = u0
        while (u < u1 - 0.8) {
          const w = Math.min(u1 - u, 1.4 + rnd() * 0.8)
          box(u, v0, u + w - 0.12, v0 + Math.min(v1 - v0, 2.2), 0, 1.2 + rnd() * 0.8)
          u += w
        }
      }
    } else if (st === 'apt') {
      // hunian vertikal: 2 slab sejajar, menara titik, atau blok perimeter
      const h = Math.min(3.8, 2 + rnd() * 1 + D)
      if (k < 0.4) {
        const t = Math.min(1.2, (v1 - v0) * 0.32)
        box(u0, v0, u1, v0 + t, 0, h)
        box(u0, v1 - t, u1, v1, 0, h * (0.8 + rnd() * 0.2))
      } else if (k < 0.75) tower(u0 + 0.3, v0 + 0.2, u1 - 0.3, v1 - 0.2, h + 0.4)
      else {
        court(u0, v0, u1, v1, h * 0.6, Math.min(1.1, (v1 - v0) * 0.3))
        trees.push([cx, cy])
      }
    } else if (st === 'civic') {
      // gedung publik rendah-lebar: badan + atap mundur
      const m = 0.35, h = 1.3 + rnd() * 0.6
      box(-hw + m, -hh + m, hw - m, hh - m, 0, h)
      box(-hw + m + 0.4, -hh + m + 0.4, hw - m - 0.4, hh - m - 0.4, h, h + 0.4, { plain: true })
    } else if (st === 'old') {
      // deret ruko sempit (1.1–1.6) 2–3 lantai, menghadap jalan
      let u = -hw + 0.15
      while (u < hw - 1) {
        const w = Math.min(hw - 0.15 - u, 1.1 + rnd() * 0.5)
        if (rnd() < 0.9) box(u, -hh + 0.15, u + w - 0.1, -hh + 0.15 + Math.min(hh * 2 - 0.6, 2.2 + rnd() * 0.4), 0, 1.2 + rnd() * 0.8)
        u += w
      }
    } else if (st === 'ind') {
      // gudang ≤ 5×3.4, kadang silo / cerobong
      const ww = Math.min(hw - 0.4, 2.5), wd = Math.min(hh - 0.4, 1.7), h = 1 + rnd() * 0.4
      box(-hw + 0.4, -hh + 0.4, -hw + 0.4 + ww * 2, -hh + 0.4 + wd * 2, 0, h)
      const rx = -hw + 0.4 + ww * 2, k = rnd()
      if (k < 0.4 && hw - rx > 1.4) for (const b of [-0.4, 0.4]) add(ring(cx + (rx + hw) / 2, cy + hh * b, 0.55, 0.55, 10), 0, 1.7, { plain: true })
      else if (k < 0.7) box(rx - 0.8, -hh + 0.6, rx - 0.5, -hh + 0.9, h, 3.2, { plain: true })
    } else if (st === 'port') {
      if (rnd() < 0.6) {
        for (let v = -hh + 0.15; v < hh - 0.5; v += 0.85) for (let u = -hw + 0.15; u + 1.45 <= hw - 0.15; u += 1.65) if (rnd() > 0.2) add(Rl(u, v, u + 1.45, v + 0.55), 0, rnd() < 0.3 ? 1.15 : 0.65, { plain: true })
      } else box(-hw + 0.3, -hh + 0.3, Math.min(hw - 0.3, -hw + 4.5), hh - 0.3, 0, 1 + rnd() * 0.4)
    } else if (st === 'campus') {
      // gedung kuliah bentuk U mengelilingi halaman
      const m = 0.4, t = 1.1, h = 1.3 + rnd() * 0.7
      box(-hw + m, -hh + m, hw - m, -hh + m + t, 0, h)
      box(-hw + m, -hh + m + t, -hw + m + t, hh - m, 0, h)
      box(hw - m - t, -hh + m + t, hw - m, hh - m, 0, h)
      treesIn(3)
    }
  }

  // isi tiap blok grid: kavling dipasang rata mengikuti batas blok
  for (let j = 0; j + 1 < YS.length; j++) {
    const ya = YS[j], yb = YS[j + 1]
    for (let i = -1; i + 1 < XS.length; i++) {
      const xa = XS[i], xb = XS[i + 1]
      // dasar blok = trotoar/pelataran: celah yang tidak dibangun terbaca kota, bukan rumput
      const ox0 = i < 0 ? Math.min(crx(ya), crx(yb)) : Math.min(gx(xa, ya), gx(xa, yb)), ox1 = Math.max(gx(xb, ya), gx(xb, yb))
      const oy0 = i < 0 ? gy(xb, ya) : Math.min(gy(xa, ya), gy(xb, ya)), oy1 = i < 0 ? gy(xb, yb) : Math.max(gy(xa, yb), gy(xb, yb))
      if (vis((ox0 + ox1) / 2, (oy0 + oy1) / 2, 120)) ground.push(`<polygon class="${DIST[distAt((ox0 + ox1) / 2, (oy0 + oy1) / 2)].st === 'park' ? 'park' : 'pad'}" points="${ptsW(R(ox0, oy0, ox1, oy1))}"/>`)
      // inset = setengah lebar visual jalan sisi itu + trotoar → muka kavling nempel jalan
      const side = (art) => (art ? 0.7 : 0.525) + CASING + 0.12
      // batas terluar blok; jalan belok (SHIFT) dipotong oleh place() supaya segitiga sisa tetap terisi
      const x0 = (i < 0 ? Math.min(crx(ya), crx(yb)) + 1 : Math.min(gx(xa, ya), gx(xa, yb)) + side(ART_X.includes(xa)))
      const x1 = Math.max(gx(xb, ya), gx(xb, yb)) - side(ART_X.includes(xb))
      const y0 = Math.min(gy(xb, ya), i < 0 ? 1e9 : gy(xa, ya)) + side(ART_Y.includes(ya))
      const y1 = Math.max(gy(xb, yb), i < 0 ? -1e9 : gy(xa, yb)) - side(ART_Y.includes(yb))
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

  // pohon tepi jalan: penuh di taman/kampus, jarang (selang-seling) di arteri kota
  {
    const TREE_ST = new Set(['park', 'campus', 'civic'])
    const inUnique = (x, y) => uniqueRects.some(([a, b, c, e]) => x > a - 0.3 && x < c + 0.3 && y > b - 0.3 && y < e + 0.3)
    for (const [a, b, w] of ROADS) {
      if (w < 1) continue
      const p = EDGE[a + '>' + b].p, off = w / 2 + 0.6
      for (let i = 2; i < p.length - 2; i += 4) {
        const [x0, y0] = p[i - 1], [x1, y1] = p[i + 1], l = Math.hypot(x1 - x0, y1 - y0) || 1
        const nx = -(y1 - y0) / l, ny = (x1 - x0) / l
        for (const s of [1, -1]) {
          const x = p[i][0] + nx * off * s, y = p[i][1] + ny * off * s
          if (!vis(x, y) || inSea(x, y, 1) || inExcl(x, y) || inUnique(x, y) || nearRoad(x, y, 0.3)) continue
          const st = DIST[distAt(x, y)].st
          if (!TREE_ST.has(st) && !(w >= 1.4 && (i / 4) % 3 === 0 && st !== 'ind' && st !== 'port')) continue
          trees.push([x, y])
        }
      }
    }
  }

  // landmark: stadion, kubah kampus, stasiun, kapal + scenic unik (scope 0.8×)
  {
    // bangunan terbesar di peta: ±13×11
    let s = prism(ring(0, -38, 6.5, 5.5, 26), 0, 1.9, { plain: true })
    s += `<polygon points="${pts(ring(0, -38, 4.6, 3.5, 26).map((p) => P(p[0], p[1], 1.9)))}" fill="#0b1e1a" stroke="#3a8a6c" stroke-width="1"/>`
    s += `<polygon points="${pts(R(-2.6, -39.8, 2.6, -36.2).map((p) => P(p[0], p[1], 1.9)))}" fill="none" stroke="#3a8a6c" stroke-opacity=".7" stroke-width=".8"/>`
    for (const [x, y] of ring(0, -38, 7, 6, 4)) {
      const [a, b] = P(x, y, 0), [c, e] = P(x, y, 4)
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
  items.push([SI * 47 + CO * -45.7, prism(R(42, -46.6, 52, -44.6), 0, 1.4) + prism(R(45, -46.2, 49, -45), 1.4, 2.2) + prism(R(41.5, -47.05, 52.5, -46.6), 1, 1.15, { plain: true })])
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
  g += ground.join('')
  // danau setelah rumput blok supaya tidak tertutup
  g += `<ellipse cx="0" cy="34" rx="5" ry="3.5" fill="var(--water)" stroke="var(--wire-hi)" stroke-opacity=".5" stroke-width=".15"/><path d="M-3 33.5h2M1 35h2.2M-1 36h1.4" stroke="#2f5f8f" stroke-width=".13"/>`
  let rc = '', rf = '', rm = ''
  for (const [a, b, w, c1, c2] of ROADS) {
    const d = `M${qw(NODES[a])}C${qw(c1)} ${qw(c2)} ${qw(NODES[b])}`
    rc += `<path d="${d}" stroke-width="${w + 2 * CASING}"/>`
    rf += `<path d="${d}" stroke-width="${w}"/>`
    if (w >= 1.3) rm += d
  }
  g += `<g fill="none" stroke="#4d77a0" stroke-linecap="round" stroke-linejoin="round">${rc}</g><g fill="none" stroke="var(--road)" stroke-linecap="round">${rf}</g>`
  g += `<path d="${rm}" fill="none" stroke="#e0bb62" stroke-opacity=".6" stroke-width=".13" stroke-dasharray=".8 1"/>`
  const rd = `M${qw(r0)}L${qw(r1)}`
  g += `<path d="${rd}" stroke="#0a1120" stroke-width="1.7"/><path d="${rd}" stroke="#5f7fa3" stroke-width="1.1" stroke-dasharray=".14 .45"/><path d="M${qw([r0[0], r0[1] - 0.3])}L${qw([r1[0], r1[1] - 0.3])}M${qw([r0[0], r0[1] + 0.3])}L${qw([r1[0], r1[1] + 0.3])}" stroke="var(--wire-hi)" stroke-opacity=".7" stroke-width=".09"/>`

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

  // pohon 3D (billboard): bayangan + batang + tajuk, ikut depth-sort bersama gedung
  const boxes = FOOT.map((poly) => poly.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [1e9, 1e9, -1e9, -1e9]))
  const inBld = (x, y) => boxes.some(([a, b, c, e]) => x > a - 0.35 && x < c + 0.35 && y > b - 0.35 && y < e + 0.35)
  for (const [x, y] of trees) {
    if (inBld(x, y)) continue
    const sz = 0.38 + rnd() * 0.2, r = sz * 11, [sx, sy] = P(x, y), [tx, ty] = P(x, y, 0.35)
    const f = (v) => v.toFixed(1), st = DIST[distAt(x, y)].st
    let t = `<ellipse cx="${f(sx + r * 0.3)}" cy="${f(sy + 0.6)}" rx="${f(r)}" ry="${f(r * 0.5)}" fill="#000" opacity=".35"/>`
      + `<line x1="${f(sx)}" y1="${f(sy)}" x2="${f(tx)}" y2="${f(ty)}" stroke="#5b4a36" stroke-width="1.4"/>`
    if ((st === 'park' || st === 'campus') && rnd() < 0.3) {
      // cemara: dua segitiga bertumpuk
      for (const [k, w] of [[0, 1], [1, 0.7]]) {
        const by = ty - k * r * 0.9, hw = r * w
        t += `<polygon points="${f(tx - hw)},${f(by)} ${f(tx + hw)},${f(by)} ${f(tx)},${f(by - r * 1.6)}" fill="#17503a" stroke="#5cbf8a" stroke-width=".8" stroke-linejoin="round"/>`
      }
    } else {
      const cy = ty - r * 0.8
      t += `<circle cx="${f(tx)}" cy="${f(cy)}" r="${f(r)}" fill="#1c5a3b" stroke="#5cbf8a" stroke-width=".8"/>`
        + `<circle cx="${f(tx - r * 0.3)}" cy="${f(cy - r * 0.3)}" r="${f(r * 0.45)}" fill="#2f8a5a" opacity=".7"/>`
    }
    items.push([SI * x + CO * y, t])
  }

  items.sort((a, b) => a[0] - b[0])
  return `<rect x="-3000" y="-3000" width="6000" height="6000" fill="var(--ground)"/><g transform="${GROUND}">${g}</g>${lamps}${items.map((i) => i[1]).join('')}`
}

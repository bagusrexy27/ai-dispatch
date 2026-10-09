import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderCity, FOOT, CASING } from '../src/map/city.js'
import { ROADS, EDGE, RAIL } from '../src/map/geometry.js'

test('tidak ada gedung yang menimpa jalan atau rel', () => {
  renderCity()
  assert.ok(FOOT.length > 100)
  const lanes = []
  for (const [a, b, w] of ROADS) for (const p of EDGE[a + '>' + b].p) lanes.push([p[0], p[1], w / 2 + CASING])
  for (let x = RAIL[0][0]; x < RAIL[1][0]; x += 0.3) lanes.push([x, RAIL[0][1], 0.85])
  // sampel keliling footprint tiap 0.3 + titik tengah
  const bad = []
  for (const poly of FOOT) {
    const s = [poly.reduce((c, p) => [c[0] + p[0] / poly.length, c[1] + p[1] / poly.length], [0, 0])]
    for (let i = 0; i < poly.length; i++) {
      const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.3)
      for (let k = 0; k < n; k++) s.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n])
    }
    const hit = s.find(([x, y]) => lanes.some(([lx, ly, r]) => Math.hypot(x - lx, y - ly) < r))
    if (hit) bad.push(hit.map((v) => v.toFixed(1)).join(','))
  }
  assert.deepEqual(bad, [], `gedung di atas jalan di: ${bad.slice(0, 10).join(' | ')}`)
})

import { LOCS, P, pts, worldRoute, pathLen, along } from './geometry.js'

const SVGNS = 'http://www.w3.org/2000/svg'
const PER_ROW = 5
const SLOT_GAP = 30
const SETTLE_SPEED = 220
const STAMP_MS = 3200

function svgEl(tag, attrs, html) {
  const e = document.createElementNS(SVGNS, tag)
  for (const k in attrs) e.setAttribute(k, attrs[k])
  if (html) e.innerHTML = html
  return e
}

function slotPositions(entities) {
  const byLoc = {}
  for (const e of entities) (byLoc[e.loc] ??= []).push(e.id)
  const out = {}
  for (const [loc, ids] of Object.entries(byLoc)) {
    const [mx, my] = LOCS[loc].anchor
    ids.forEach((id, i) => {
      const row = Math.floor(i / PER_ROW), inRow = Math.min(PER_ROW, ids.length - row * PER_ROW), col = i % PER_ROW
      out[id] = [mx + (col - (inRow - 1) / 2) * SLOT_GAP, my - 40 - row * SLOT_GAP]
    })
  }
  return out
}

/* entity: { id, loc, status, parentId?, radioTo? } — hero atau sidekick */
export function createAnimator() {
  const st = new Map()
  const nodes = new Map()
  const packages = []
  let layers = null
  let entities = []
  let mapTop = -300
  let raf = 0
  let last = 0
  let onTravel = () => {}
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

  function apply(id) {
    const s = st.get(id), node = nodes.get(id)
    if (s?.pos && node) node.setAttribute('transform', `translate(${s.pos[0].toFixed(1)} ${s.pos[1].toFixed(1)})`)
  }

  function setPos(id, pos) {
    st.get(id).pos = pos
    apply(id)
  }

  function endTravel(id, s) {
    s.trail?.remove()
    s.trail = null
    onTravel(id, false)
  }

  function travel(id, s, to, target) {
    const from = s.loc
    s.loc = to
    if (s.trail) endTravel(id, s)
    if (reduced) {
      s.path = null
      setPos(id, target)
      return
    }
    const road = worldRoute(from, to), p = [s.pos, ...road, target], len = pathLen(p)
    s.path = { pts: p, len, d: 0, speed: Math.max(380, len / 2.4) }
    s.trail = svgEl('polyline', { class: 'trail', points: pts(road), stroke: LOCS[to].color, style: `color:${LOCS[to].color}` })
    layers?.trails.appendChild(s.trail)
    onTravel(id, true)
  }

  function drawLinks() {
    if (!layers) return
    let out = ''
    for (const s of st.values()) {
      const parent = s.parentId && st.get(s.parentId)
      if (parent?.pos && s.pos) {
        const [x1, y1] = parent.pos, [x2, y2] = s.pos
        out += `<path class="link-deleg" d="M${x1} ${y1}Q${(x1 + x2) / 2} ${Math.max(mapTop + 20, Math.min(y1, y2) - 60)} ${x2} ${y2}"/>`
      }
      const peer = s.status === 'talking' && s.radioTo && !s.path && st.get(s.radioTo)
      if (peer?.pos && s.pos) {
        const [x1, y1] = s.pos, [x2, y2] = peer.pos
        out += `<path class="link-radio" d="M${x1} ${y1}Q${(x1 + x2) / 2} ${Math.max(mapTop + 20, Math.min(y1, y2) - 40)} ${x2} ${y2}"/>`
      }
    }
    layers.links.innerHTML = out
  }

  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000)
    last = t
    let arrived = false
    for (const [id, s] of st) {
      if (!s.path) continue
      const p = s.path
      p.d = Math.min(p.len, p.d + p.speed * dt)
      setPos(id, along(p.pts, p.d))
      if (p.d >= p.len) {
        s.path = null
        if (s.trail) {
          endTravel(id, s)
          arrived = true
        }
      }
    }
    for (const pk of [...packages]) {
      pk.d = Math.min(pk.len, pk.d + pk.speed * dt)
      const [x, y] = along(pk.pts, pk.d)
      pk.g.setAttribute('transform', `translate(${x} ${y})`)
      if (pk.d >= pk.len) {
        pk.g.remove()
        packages.splice(packages.indexOf(pk), 1)
        layers?.fx.ownerSVGElement.querySelectorAll('#lm-dock .roof').forEach((r) => {
          r.classList.remove('lit-flash')
          void r.getBBox()
          r.classList.add('lit-flash')
        })
      }
    }
    if (arrived) sync(entities)
    drawLinks()
    raf = [...st.values()].some((s) => s.path) || packages.length ? requestAnimationFrame(frame) : 0
  }

  function kick() {
    if (raf) return
    last = performance.now()
    raf = requestAnimationFrame(frame)
  }

  function sync(next) {
    entities = next
    const slots = slotPositions(next)
    const ids = new Set(next.map((e) => e.id))
    for (const [id, s] of st) {
      if (ids.has(id)) continue
      s.trail?.remove()
      st.delete(id)
    }
    for (const e of next) {
      let s = st.get(e.id)
      const target = slots[e.id]
      if (!s) {
        const parent = e.parentId && st.get(e.parentId)
        s = { loc: parent?.pos ? parent.loc : e.loc, pos: parent?.pos ?? target, path: null, trail: null }
        st.set(e.id, s)
      }
      Object.assign(s, { status: e.status, parentId: e.parentId, radioTo: e.radioTo })
      if (e.loc !== s.loc) travel(e.id, s, e.loc, target)
      else if (!s.trail && Math.hypot(target[0] - s.pos[0], target[1] - s.pos[1]) > 1) {
        if (reduced) s.pos = target
        else s.path = { pts: [s.pos, target], len: pathLen([s.pos, target]), d: 0, speed: SETTLE_SPEED }
      }
      apply(e.id)
    }
    drawLinks()
    kick()
  }

  function ship(id) {
    const s = st.get(id)
    if (!s?.pos || reduced || !layers || s.loc === 'dock') return
    const dock = LOCS.dock
    const g = svgEl('g', { filter: 'url(#glow)' }, '<rect x="-6" y="-6" width="12" height="12" rx="2" fill="var(--ok)" stroke="var(--ink)" stroke-width="1.5"/>')
    layers.fx.appendChild(g)
    const p = [s.pos, ...worldRoute(s.loc, 'dock'), P(dock.cx, dock.cy, dock.h)], len = pathLen(p)
    packages.push({ g, pts: p, len, d: 0, speed: Math.max(480, len / 1.8) })
    kick()
  }

  function stamp(id, text, color) {
    const s = st.get(id)
    if (!s?.pos || !layers) return
    const t = svgEl('text', { x: s.pos[0], y: s.pos[1] - 26, 'text-anchor': 'middle', class: 'stamp', fill: color })
    t.textContent = text
    layers.fx.appendChild(t)
    setTimeout(() => t.remove(), STAMP_MS)
  }

  return {
    sync,
    ship,
    stamp,
    setNode(id, el) {
      if (el) {
        nodes.set(id, el)
        apply(id)
      } else nodes.delete(id)
    },
    mount(next) {
      layers = next
    },
    configure(opts) {
      onTravel = opts.onTravel ?? onTravel
      mapTop = opts.mapTop ?? mapTop
    },
    destroy() {
      cancelAnimationFrame(raf)
      raf = 0
      for (const s of st.values()) s.trail?.remove()
      for (const pk of packages) pk.g.remove()
      packages.length = 0
      layers = null
    },
  }
}

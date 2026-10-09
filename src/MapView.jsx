import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { LOCS, MAP_ZOOM_MAX, MAP_ZOOM_MIN } from './map/geometry'
import { renderCity } from './map/city'
import { createAnimator } from './map/animator'
import { MODEL_BG, STATUS } from './lib/status'
import { IconPaths } from './lib/icons'
import { FaceImage } from './HeroFace'

const CITY = renderCity()
const STAMPS = { commit: ['Beres!', 'var(--ok)'], error: ['Waduh', 'var(--fail)'] }
const DEFAULT_CX = 0
const DEFAULT_CY = -30

function fitBase(width, height) {
  const vw = Math.max(1000, Math.min(1150, width * 1.05))
  const vh = (vw * height) / width
  return { vw, vh }
}

/** Scope peta = apa yang terlihat di MAP_ZOOM_MIN (0.8×). Di situ pan mentok. */
function scopeBounds(vw, vh) {
  const w = vw / MAP_ZOOM_MIN
  const h = vh / MAP_ZOOM_MIN
  return {
    minX: DEFAULT_CX - w / 2,
    maxX: DEFAULT_CX + w / 2,
    minY: DEFAULT_CY - h / 2,
    maxY: DEFAULT_CY + h / 2,
  }
}

function clampCamera(cx, cy, zoom, vw, vh) {
  const z = Math.min(MAP_ZOOM_MAX, Math.max(MAP_ZOOM_MIN, zoom))
  const viewW = vw / z
  const viewH = vh / z
  const { minX, minY, maxX, maxY } = scopeBounds(vw, vh)
  const halfW = viewW / 2
  const halfH = viewH / 2
  const xMin = minX + halfW
  const xMax = maxX - halfW
  const yMin = minY + halfH
  const yMax = maxY - halfH
  // Di zoom min, xMin≈xMax → pan terkunci di pusat scope
  return {
    zoom: z,
    cx: Math.min(xMax, Math.max(xMin, cx)),
    cy: Math.min(yMax, Math.max(yMin, cy)),
    viewW,
    viewH,
  }
}

function toEntities(heroes) {
  return heroes.flatMap((h) => [
    { id: h.id, loc: h.loc, status: h.status, radioTo: h.radioTo },
    ...h.sidekicks.map((s) => ({ id: s.id, loc: s.loc, status: s.status, parentId: h.id })),
  ])
}

const City = () => <g dangerouslySetInnerHTML={{ __html: CITY }} />

function Marker({ id, here }) {
  const L = LOCS[id]
  const [rx, ry] = L.roof, [mx, my] = L.anchor
  const alert = here.some((e) => e.status === 'attention')
  const stroke = alert ? 'var(--alert)' : L.color
  return (
    <g>
      <line x1={rx} y1={ry - 4} x2={mx} y2={L.slim ? my : my + 17} stroke={L.color} strokeWidth="1.4" strokeDasharray="2 3" />
      {alert && <circle className="mk-ring-alert" cx={mx} cy={my} r="17" />}
      <circle cx={mx} cy={my} r="16" fill="var(--panel)" stroke={stroke} strokeWidth="2.5" />
      <g transform={`translate(${mx - 10} ${my - 10}) scale(.84)`} fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <IconPaths name={alert ? 'attention' : L.icon} />
      </g>
      <g transform={`translate(${mx + 22} ${my - 13})`}>
        <rect width={Math.max(84, L.name.length * 7.6 + 14)} height="26" rx="3" fill="var(--panel)" fillOpacity=".92" stroke="var(--ink)" strokeWidth="2" />
        <rect width="3" height="26" fill={L.color} />
        <text className="mk-name" x="9" y="12">{L.name}</text>
        <text className="mk-sub" x="9" y="22">{L.sub} · {here.length} hero</text>
      </g>
    </g>
  )
}

function MapHero({ hero, model, sidekick, traveling, selected, onSelect, nodeRef }) {
  const r = sidekick ? 9 : 14
  const face = sidekick ? null : <FaceImage hero={hero} r={r - 1} clipId={`face-clip-${hero.id}`} />
  const col = traveling ? 'var(--text)' : STATUS[hero.status].color
  const attention = hero.status === 'attention'
  return (
    <g
      ref={nodeRef}
      className={`hero${selected ? ' selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`${hero.callsign}: ${STATUS[hero.status].label}`}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <circle className="sel" r={r + 7} />
      {attention && <circle className="ring-alert" r={r + 1} />}
      <circle r={r} fill={MODEL_BG[model] ?? '#999'} stroke="var(--ink)" strokeWidth="2" />
      {face ?? <text y={sidekick ? 3 : 4} textAnchor="middle" fontSize={sidekick ? 8 : 11} fontWeight="700" fontFamily="var(--font-display)" fill="var(--ink)">{model}</text>}
      <circle r={r} fill="none" stroke={col} strokeWidth="2.5" />
      {hero.status === 'coding' && !traveling && <circle className="ring-progress" r={r + 4} stroke={col} />}
      {attention && (
        <g transform={`translate(${r - 2} ${-r - 4})`}>
          <rect x="-6" y="-7" width="12" height="13" rx="2" fill="var(--alert)" stroke="var(--ink)" strokeWidth="1.5" />
          <text y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink)" fontFamily="var(--font-display)">!</text>
        </g>
      )}
      <text className="lbl" y={r + 11} textAnchor="middle">{hero.callsign}</text>
      <title>{`${hero.callsign} · ${STATUS[hero.status].label}${hero.project ? ` · ${hero.project}` : ''}`}</title>
    </g>
  )
}

function MapView({ heroes, log, selected, traveling, onSelect, onTravelChange, children }) {
  const wrapRef = useRef(null)
  const svgRef = useRef(null)
  const linksRef = useRef(null)
  const trailsRef = useRef(null)
  const fxRef = useRef(null)
  const dragRef = useRef(null)
  const camRef = useRef({ cx: DEFAULT_CX, cy: DEFAULT_CY, zoom: 1 })
  const [anim] = useState(createAnimator)
  const [base, setBase] = useState(() => fitBase(1000, 600))
  const [cam, setCam] = useState(() => clampCamera(DEFAULT_CX, DEFAULT_CY, 1, 1050, 630))
  const lastLogId = useRef(log.at(-1)?.id ?? 0)
  const entities = toEntities(heroes)

  useEffect(() => {
    camRef.current = cam
  }, [cam])

  useLayoutEffect(() => {
    anim.mount({ links: linksRef.current, trails: trailsRef.current, fx: fxRef.current })
    return () => anim.destroy()
  }, [anim])

  useLayoutEffect(() => {
    anim.configure({ onTravel: onTravelChange, mapTop: cam.cy - cam.viewH / 2 })
    anim.sync(entities)
  })

  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (!width) return
      const next = fitBase(width, height)
      setBase(next)
      setCam((c) => clampCamera(c.cx, c.cy, c.zoom, next.vw, next.vh))
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    for (const e of log) {
      if (e.id <= lastLogId.current) continue
      if (STAMPS[e.type]) anim.stamp(e.heroId, ...STAMPS[e.type])
      if (e.type === 'commit') anim.ship(e.heroId)
    }
    lastLogId.current = log.at(-1)?.id ?? lastLogId.current
  }, [log, anim])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const clientToWorld = (clientX, clientY) => {
      const rect = svgRef.current.getBoundingClientRect()
      const { cx, cy, viewW, viewH } = camRef.current
      return [
        ((clientX - rect.left) / rect.width) * viewW + (cx - viewW / 2),
        ((clientY - rect.top) / rect.height) * viewH + (cy - viewH / 2),
      ]
    }

    const onWheel = (e) => {
      e.preventDefault()
      const { cx, cy, zoom } = camRef.current
      const factor = e.deltaY > 0 ? 0.9 : 1.11
      const [wx, wy] = clientToWorld(e.clientX, e.clientY)
      const nextZoom = zoom * factor
      const clamped = clampCamera(cx, cy, nextZoom, base.vw, base.vh)
      const viewW = base.vw / clamped.zoom
      const viewH = base.vh / clamped.zoom
      const rect = svgRef.current.getBoundingClientRect()
      const nx = wx - ((e.clientX - rect.left) / rect.width - 0.5) * viewW
      const ny = wy - ((e.clientY - rect.top) / rect.height - 0.5) * viewH
      setCam(clampCamera(nx, ny, clamped.zoom, base.vw, base.vh))
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [base.vw, base.vh])

  function onPointerDown(e) {
    if (e.button !== 0) return
    dragRef.current = {
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      cx: cam.cx,
      cy: cam.cy,
      zoom: cam.zoom,
      viewW: cam.viewW,
      viewH: cam.viewH,
      moved: false,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.classList.add('panning')
  }

  function onPointerMove(e) {
    const d = dragRef.current
    if (!d || d.pointerId !== e.pointerId) return
    const rect = svgRef.current.getBoundingClientRect()
    const { viewW, viewH, zoom } = camRef.current
    const dx = ((e.clientX - d.x) / rect.width) * (d.viewW ?? viewW)
    const dy = ((e.clientY - d.y) / rect.height) * (d.viewH ?? viewH)
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 3) d.moved = true
    setCam(clampCamera(d.cx - dx, d.cy - dy, d.zoom ?? zoom, base.vw, base.vh))
  }

  function onPointerUp(e) {
    const d = dragRef.current
    if (!d || d.pointerId !== e.pointerId) return
    dragRef.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
    e.currentTarget.classList.remove('panning')
  }

  function resetCamera() {
    setCam(clampCamera(DEFAULT_CX, DEFAULT_CY, 1, base.vw, base.vh))
  }

  const viewBox = `${cam.cx - cam.viewW / 2} ${cam.cy - cam.viewH / 2} ${cam.viewW} ${cam.viewH}`

  return (
    <section ref={wrapRef} className="map-wrap box" aria-label="Peta kota">
      <svg
        ref={svgRef}
        className="map"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Peta kota wireframe: geser untuk pan, scroll untuk zoom"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={resetCamera}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <City />
        <g>
          {Object.keys(LOCS).map((id) => (
            <Marker key={id} id={id} here={entities.filter((e) => e.loc === id && !traveling.has(e.id))} />
          ))}
        </g>
        <g ref={linksRef} />
        <g ref={trailsRef} />
        <g>
          {heroes.map((h) => (
            <MapHero key={h.id} hero={h} model={h.model} traveling={traveling.has(h.id)} selected={selected === h.id} onSelect={() => onSelect(h.id)} nodeRef={(el) => anim.setNode(h.id, el)} />
          ))}
          {heroes.flatMap((h) => h.sidekicks.map((s) => (
            <MapHero key={s.id} hero={s} model={h.model} sidekick traveling={traveling.has(s.id)} selected={false} onSelect={() => onSelect(h.id)} nodeRef={(el) => anim.setNode(s.id, el)} />
          )))}
        </g>
        <g ref={fxRef} />
      </svg>
      <div className="scan" />
      <div className="hud-corner" style={{ left: 12, top: 10 }}>PETA DISPATCH // SEKTOR 7<br />LAT -6.2088 · LON 106.8456</div>
      <div className="hud-corner" style={{ right: 14, top: 10, textAlign: 'right' }}>U ▲<br />ZOOM {cam.zoom.toFixed(1)}×</div>
      <div className="map-hint mono">Geser · scroll zoom · 2× klik = reset · 1–9 = hero · Space = telepon</div>
      {children}
    </section>
  )
}

export default MapView

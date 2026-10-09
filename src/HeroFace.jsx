import { characterFor } from './lib/characters'

/* background-position % yang menaruh titik wajah c (pecahan) di tengah kotak berukuran s */
const focus = (c, s) => `${Math.min(100, Math.max(0, ((c - s / 2) / (1 - s)) * 100)).toFixed(1)}%`

export function HeroFace({ hero, className = '' }) {
  const character = characterFor(hero)
  if (!character) return <span className={`badge m-${hero.model} ${className}`} aria-label={`model ${hero.model}`}>{hero.model}</span>
  const [cx, cy, s] = character.face
  return (
    <span
      className={`face m-${hero.model} ${className}`}
      role="img"
      aria-label={`${hero.callsign ?? character.title}, model ${hero.model}`}
      style={{ backgroundImage: `url(${character.image})`, backgroundSize: `${100 / s}%`, backgroundPosition: `${focus(cx, s)} ${focus(cy, s)}` }}
    />
  )
}

export function FaceImage({ hero, r, clipId }) {
  const character = characterFor(hero)
  if (!character) return null
  const [cx, cy, s] = character.face
  const w = (2 * r) / s
  return (
    <>
      <clipPath id={clipId}><circle r={r} /></clipPath>
      <image href={character.image} x={-cx * w} y={-cy * w} width={w} height={w} clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice" />
    </>
  )
}

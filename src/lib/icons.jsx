const ICON = {
  coding: <><path d="M4 20l8-8" /><path d="M13 3l8 8-3 3-8-8z" /></>,
  reading: <><circle cx="10" cy="10" r="6" /><path d="M15 15l5 5" /></>,
  talking: <><path d="M4 13a8 8 0 0 1 16 0" /><path d="M8 13a4 4 0 0 1 8 0" /><circle cx="12" cy="15" r="1.5" /></>,
  waiting: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  idle: <><path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" /><path d="M16 10h2a2 2 0 0 1 0 4h-2" /></>,
  attention: <path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  box: <><path d="M4 8l8-4 8 4v8l-8 4-8-4z" /><path d="M4 8l8 4 8-4M12 12v8" /></>,
  hq: <><path d="M4 20V9l8-5 8 5v11" /><path d="M9 20v-6h6v6" /></>,
}

export function IconPaths({ name }) {
  return ICON[name] ?? null
}

export function Icon({ name, className, style }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
      {ICON[name]}
    </svg>
  )
}

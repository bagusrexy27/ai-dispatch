const ms = (ts, fallback) => Date.parse(ts) || fallback

export function translate(env) {
  const p = env?.payload
  if (!p || typeof env.type !== 'string') return null
  const at = ms(env.ts, Date.now())

  switch (env.type) {
    case 'hero_upsert':
      return p.hero?.id ? { type: 'hero_upsert', heroId: p.hero.id, hero: p.hero, at } : null
    case 'session_end':
      return { type: 'session_end', heroId: p.heroId, at }
    case 'status':
    case 'dispatch':
      return { type: 'status', heroId: p.heroId, status: p.status, radioTo: p.radioTo, at }
    case 'read':
    case 'edit':
    case 'write':
      return { type: env.type === 'read' ? 'read' : 'edit', heroId: p.heroId, file: p.path, at }
    case 'delegate':
      return { type: 'delegate', heroId: p.parentId, sidekick: p.sidekick, task: p.task, at }
    case 'sidekick_end':
      return { type: 'sidekick_end', heroId: p.parentId, sidekickId: p.sidekickId, sidekickCallsign: p.sidekickCallsign ?? p.sidekickId, at }
    case 'commit':
      return { type: 'commit', heroId: p.heroId, sha: p.sha, message: p.message, at }
    case 'error':
      return { type: 'error', heroId: p.heroId, error: p.errorShort, at }
    case 'token_usage':
      return { type: 'token_usage', heroId: p.heroId, used: p.tokensUsed, max: p.tokensMax, at }
    case 'cost':
      return p.heroId ? { type: 'cost', heroId: p.heroId, costUsd: p.costUsd, at } : null
    case 'call_open': {
      const { call } = p
      if (!call?.callId) return null
      return { type: 'call_open', heroId: call.heroId, call: { ...call, options: call.options ?? undefined, startedAt: ms(call.startedAt, at) }, at }
    }
    case 'call_closed':
      if (p.reason === 'answered' && p.decision) {
        return { type: 'call_result', callId: p.callId, decision: p.decision, optionId: p.optionId, optionLabel: p.optionLabel, message: p.message, at }
      }
      return { type: 'call_closed', callId: p.callId, reason: p.reason, at }
    case 'server_notice':
      return { type: 'notice', level: p.level, text: p.text, at }
    default:
      return null
  }
}

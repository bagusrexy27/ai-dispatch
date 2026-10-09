#!/usr/bin/env node
/**
 * Cursor → AI Dispatch hook.
 * Reads hook JSON on stdin; emits Dispatch events; optionally gates shell via markas.
 *
 * Env: DISPATCH_URL, DISPATCH_TOKEN, DISPATCH_GATE=1, DISPATCH_GATE_TIMEOUT_MS
 */
import {
  GATE, emit, gatePermission, heroIdFor, readStdin, shortPath, upsertHero,
} from '../lib/dispatch.mjs'

function projectName(roots) {
  const root = Array.isArray(roots) && roots[0]
  if (!root) return 'workspace'
  return String(root).replace(/[\\/]+$/, '').split(/[\\/]/).pop() || 'workspace'
}

async function main() {
  const ev = await readStdin()
  const name = ev.hook_event_name || ev.hookEventName || ''
  const heroId = heroIdFor(ev.conversation_id || ev.session_id || ev.generation_id)
  const cwd = ev.cwd || (Array.isArray(ev.workspace_roots) ? ev.workspace_roots[0] : undefined)

  try {
    if (name === 'sessionStart') {
      await upsertHero({
        id: heroId,
        model: 'CU',
        variant: 'Agent',
        project: projectName(ev.workspace_roots),
        task: 'Cursor agent session',
        status: 'idle',
      })
      process.stdout.write(JSON.stringify({}))
      return
    }

    if (name === 'sessionEnd') {
      await emit('session_end', { heroId })
      return
    }

    if (name === 'afterFileEdit') {
      await emit('edit', { heroId, path: shortPath(ev.file_path, cwd), op: 'edit' })
      await emit('status', { heroId, status: 'coding' })
      return
    }

    if (name === 'beforeReadFile') {
      await emit('read', { heroId, path: shortPath(ev.file_path, cwd), op: 'read' })
      await emit('status', { heroId, status: 'reading' })
      process.stdout.write(JSON.stringify({ permission: 'allow' }))
      return
    }

    if (name === 'afterShellExecution') {
      await emit('status', { heroId, status: 'coding' })
      return
    }

    if (name === 'beforeShellExecution') {
      if (!GATE) {
        process.stdout.write(JSON.stringify({ permission: 'allow' }))
        return
      }
      const cmd = String(ev.command || '').slice(0, 400)
      const { ok } = await gatePermission({
        heroId,
        techLine: `shell\ncwd: ${cwd || '—'}\n${cmd}`,
        quote: `Boss, Cursor mau jalanin \`${cmd.slice(0, 60)}\`. Boleh?`,
      })
      process.stdout.write(JSON.stringify({
        permission: ok ? 'allow' : 'deny',
        user_message: ok ? undefined : 'Ditolak dari AI Dispatch markas',
        agent_message: ok ? 'Approved at markas' : 'Denied at markas',
      }))
      return
    }

    if (name === 'stop') {
      await emit('status', { heroId, status: ev.status === 'error' ? 'attention' : 'idle' })
    }
  } catch (err) {
    console.error('[ai-dispatch]', err.message)
    if (name === 'beforeShellExecution' || name === 'beforeReadFile') {
      process.stdout.write(JSON.stringify({ permission: 'allow' }))
    }
  }
}

main()

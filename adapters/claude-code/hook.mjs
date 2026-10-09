#!/usr/bin/env node
/**
 * Claude Code → AI Dispatch hook.
 * Reads hook JSON on stdin; emits Dispatch events; optionally gates Bash via markas.
 *
 * Env: DISPATCH_URL, DISPATCH_TOKEN, DISPATCH_GATE=1, DISPATCH_GATE_TIMEOUT_MS
 */
import {
  GATE, emit, gatePermission, heroIdFor, readStdin, shortPath, upsertHero,
} from '../lib/dispatch.mjs'

const READ_TOOLS = new Set(['Read', 'Glob', 'Grep', 'NotebookRead'])
const EDIT_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit'])
const SHELL_TOOLS = new Set(['Bash', 'BashOutput'])

function projectName(cwd) {
  if (!cwd) return 'workspace'
  return String(cwd).replace(/[\\/]+$/, '').split(/[\\/]/).pop() || 'workspace'
}

function toolPath(input = {}) {
  return input.file_path || input.path || input.notebook_path || null
}

function shellLine(input = {}) {
  return input.command || input.description || JSON.stringify(input).slice(0, 200)
}

async function main() {
  const ev = await readStdin()
  const name = ev.hook_event_name || ev.hookEventName || ''
  const heroId = heroIdFor(ev.session_id || ev.sessionId)
  const cwd = ev.cwd

  try {
    if (name === 'SessionStart') {
      await upsertHero({
        id: heroId,
        model: 'CL',
        variant: ev.model || 'Code',
        project: projectName(cwd),
        task: `Claude Code (${ev.source || 'startup'})`,
        status: 'idle',
      })
      return
    }

    if (name === 'SessionEnd') {
      await emit('session_end', { heroId })
      return
    }

    if (name === 'PostToolUse' || name === 'PostToolUseFailure') {
      const tool = ev.tool_name || ''
      const path = shortPath(toolPath(ev.tool_input), cwd)
      if (READ_TOOLS.has(tool)) {
        await emit('read', { heroId, path, op: 'read' })
        await emit('status', { heroId, status: 'reading' })
      } else if (EDIT_TOOLS.has(tool)) {
        await emit('edit', { heroId, path, op: 'edit' })
        await emit('status', { heroId, status: 'coding' })
      } else if (SHELL_TOOLS.has(tool)) {
        await emit('status', { heroId, status: name === 'PostToolUseFailure' ? 'attention' : 'coding' })
      } else if (name === 'PostToolUseFailure') {
        await emit('error', { heroId, errorShort: String(ev.error || tool || 'tool failed').slice(0, 120) })
      }
      return
    }

    if (name === 'PreToolUse' || name === 'PermissionRequest') {
      const tool = ev.tool_name || ''
      if (GATE && SHELL_TOOLS.has(tool)) {
        const tech = shellLine(ev.tool_input)
        const { ok } = await gatePermission({
          heroId,
          techLine: `tool: ${tool}\n${tech}`,
          quote: `Boss, Claude mau jalanin \`${String(tech).slice(0, 60)}\`. Boleh?`,
        })
        const decision = ok ? 'allow' : 'deny'
        process.stdout.write(JSON.stringify({
          hookSpecificOutput: {
            hookEventName: name,
            permissionDecision: decision,
            permissionDecisionReason: ok ? 'Approved at AI Dispatch markas' : 'Denied at AI Dispatch markas',
          },
        }))
      }
      return
    }
  } catch (err) {
    // Fail open: never block Claude Code if Dispatch is down (unless GATE already decided).
    console.error('[ai-dispatch]', err.message)
  }
}

main()

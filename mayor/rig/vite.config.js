import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import os from 'os'
import fs from 'fs'
import path from 'path'

function readClaudeUsage() {
  const projectsDir = path.join(os.homedir(), '.claude/projects')
  const now = Date.now()
  const windows = { '5h': now - 5 * 3600 * 1000, '24h': now - 86400 * 1000 }
  const result = {}
  for (const w of Object.keys(windows)) result[w] = {}

  let files = []
  try {
    for (const proj of fs.readdirSync(projectsDir)) {
      const projDir = path.join(projectsDir, proj)
      try {
        for (const f of fs.readdirSync(projDir)) {
          if (f.endsWith('.jsonl')) files.push(path.join(projDir, f))
        }
      } catch {}
    }
  } catch {}

  for (const filepath of files) {
    let content
    try { content = fs.readFileSync(filepath, 'utf-8') } catch { continue }
    for (const line of content.split('\n')) {
      if (!line.trim()) continue
      let d
      try { d = JSON.parse(line) } catch { continue }
      const ts = d.timestamp
      if (!ts) continue
      const t = new Date(ts).getTime()
      if (isNaN(t)) continue

      const msg = d.message
      if (!msg || typeof msg !== 'object' || msg.role !== 'assistant') continue
      const usage = msg.usage
      const model = msg.model
      if (!usage || !model || model === '<synthetic>') continue

      const inp = usage.input_tokens || 0
      const out = usage.output_tokens || 0
      const cr = usage.cache_read_input_tokens || 0
      const cw = usage.cache_creation_input_tokens || 0

      for (const [w, cutoff] of Object.entries(windows)) {
        if (t >= cutoff) {
          if (!result[w][model]) result[w][model] = { model, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, calls: 0 }
          result[w][model].input += inp
          result[w][model].output += out
          result[w][model].cacheRead += cr
          result[w][model].cacheWrite += cw
          result[w][model].calls += 1
        }
      }
    }
  }

  // Convert to arrays
  for (const w of Object.keys(result)) result[w] = Object.values(result[w])
  return result
}

function readOpenClawUsage() {
  try {
    const sessionsPath = path.join(os.homedir(), '.openclaw/agents/main/sessions/sessions.json')
    const sessionsMap = JSON.parse(fs.readFileSync(sessionsPath, 'utf-8'))
    const byModel = {}
    for (const [, session] of Object.entries(sessionsMap)) {
      if (!session.model) continue
      const model = session.model
      if (!byModel[model]) {
        byModel[model] = {
          model, provider: session.modelProvider ?? 'unknown',
          contextWindow: session.contextTokens ?? 0,
          totalTokens: 0, inputTokens: 0, outputTokens: 0, lastActive: 0, sessionCount: 0,
        }
      }
      const m = byModel[model]
      m.totalTokens = Math.max(m.totalTokens, session.totalTokens ?? 0)
      m.inputTokens += session.inputTokens ?? 0
      m.outputTokens += session.outputTokens ?? 0
      m.lastActive = Math.max(m.lastActive, session.updatedAt ?? 0)
      m.sessionCount += 1
    }
    const mainSession = sessionsMap['agent:main:main'] || sessionsMap['main']
    if (mainSession?.model && byModel[mainSession.model]) {
      byModel[mainSession.model].contextUsage = mainSession.totalTokens ?? 0
    }
    return Object.values(byModel)
  } catch { return [] }
}

function buildUsageReport() {
  const projectsDir = path.join(os.homedir(), '.claude/projects')
  const now = Date.now()
  const window5h = now - 5 * 3600 * 1000

  let files = []
  try {
    for (const proj of fs.readdirSync(projectsDir)) {
      const projDir = path.join(projectsDir, proj)
      try {
        for (const f of fs.readdirSync(projDir)) {
          if (f.endsWith('.jsonl')) files.push(path.join(projDir, f))
        }
      } catch {}
    }
  } catch {}

  const byModel = {}
  let earliestIn5h = now

  for (const filepath of files) {
    let content
    try { content = fs.readFileSync(filepath, 'utf-8') } catch { continue }
    for (const line of content.split('\n')) {
      if (!line.trim()) continue
      let d
      try { d = JSON.parse(line) } catch { continue }
      const ts = d.timestamp
      if (!ts) continue
      const t = new Date(ts).getTime()
      if (isNaN(t) || t < window5h) continue

      const msg = d.message
      if (!msg || typeof msg !== 'object' || msg.role !== 'assistant') continue
      const usage = msg.usage
      const model = msg.model
      if (!usage || !model || model === '<synthetic>') continue

      if (t < earliestIn5h) earliestIn5h = t

      if (!byModel[model]) byModel[model] = { model, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, calls: 0 }
      const m = byModel[model]
      m.input += usage.input_tokens || 0
      m.output += usage.output_tokens || 0
      m.cacheRead += usage.cache_read_input_tokens || 0
      m.cacheWrite += usage.cache_creation_input_tokens || 0
      m.calls += 1
    }
  }

  const resetAt = earliestIn5h + 5 * 3600 * 1000
  const resetInMs = resetAt - now
  const resetInMin = Math.round(resetInMs / 60000)

  return { models: Object.values(byModel), windowStart: earliestIn5h, resetAt, resetInMin }
}

function usageDataPlugin() {
  return {
    name: 'usage-data',
    configureServer(server) {
      server.middlewares.use('/usage-data', (req, res) => {
        try {
          const claudeUsage = readClaudeUsage()
          const openclawModels = readOpenClawUsage()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ claude: claudeUsage, openclaw: openclawModels }))
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: err.message }))
        }
      })
      server.middlewares.use('/usage-report', (req, res) => {
        try {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(buildUsageReport()))
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), usageDataPlugin()],
  server: {
    port: 8081,
    proxy: {
      '/static': 'http://localhost:8084',
      '/events': { target: 'http://localhost:8084', ws: true },
      '/api': 'http://localhost:8084',
      '/gt-source': {
        target: 'http://localhost:8084',
        rewrite: (path) => path.replace(/^\/gt-source/, ''),
      },
      '/ochat': {
        target: 'http://localhost:18789',
        rewrite: (path) => path.replace(/^\/ochat/, ''),
        headers: { 'Authorization': 'Bearer b2bb12b3703b4ad3e6e8398d700fbeb47fce6e0d79293869' },
        changeOrigin: true,
      },
    },
  },
})

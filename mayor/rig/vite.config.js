import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import os from 'os'
import fs from 'fs'
import path from 'path'

function usageDataPlugin() {
  return {
    name: 'usage-data',
    configureServer(server) {
      server.middlewares.use('/usage-data', (req, res) => {
        try {
          const sessionsPath = path.join(os.homedir(), '.openclaw/agents/main/sessions/sessions.json')
          const raw = fs.readFileSync(sessionsPath, 'utf-8')
          const sessionsMap = JSON.parse(raw)

          const byModel = {}
          for (const [, session] of Object.entries(sessionsMap)) {
            if (!session.model) continue
            const model = session.model
            if (!byModel[model]) {
              byModel[model] = {
                model,
                provider: session.modelProvider ?? 'unknown',
                contextWindow: session.contextTokens ?? 0,
                totalTokens: 0,
                inputTokens: 0,
                outputTokens: 0,
                lastActive: 0,
                sessionCount: 0,
              }
            }
            const m = byModel[model]
            m.totalTokens = Math.max(m.totalTokens, session.totalTokens ?? 0)
            m.inputTokens += session.inputTokens ?? 0
            m.outputTokens += session.outputTokens ?? 0
            m.lastActive = Math.max(m.lastActive, session.updatedAt ?? 0)
            m.sessionCount += 1
          }

          // Use the main agent session's totalTokens as the context usage (current context window fill)
          const mainSession = sessionsMap['agent:main:main'] || sessionsMap['main']
          if (mainSession?.model && byModel[mainSession.model]) {
            byModel[mainSession.model].contextUsage = mainSession.totalTokens ?? 0
          }

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ models: Object.values(byModel) }))
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

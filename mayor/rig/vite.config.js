import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

function usagePlugin() {
  return {
    name: 'usage-data',
    configureServer(server) {
      server.middlewares.use('/usage-data', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        try {
          const hoursParam = new URL(req.url, 'http://localhost').searchParams.get('hours') || '5';
          const hours = parseInt(hoursParam, 10) || 5;
          const script = `
import json, glob, os
from datetime import datetime, timedelta, timezone

cutoff = (datetime.now(timezone.utc) - timedelta(hours=${hours})).isoformat()
stats = {}

for f in glob.glob(os.path.expanduser('~/.claude/projects/**/*.jsonl'), recursive=True):
    try:
        with open(f) as fh:
            for line in fh:
                d = json.loads(line)
                ts = d.get('timestamp','')
                if ts and ts < cutoff: continue
                msg = d.get('message', {})
                if not isinstance(msg, dict): continue
                usage = msg.get('usage')
                model = msg.get('model','')
                if not usage or not model: continue
                if model not in stats:
                    stats[model] = {'input':0,'output':0,'cache_read':0,'cache_create':0}
                stats[model]['input'] += usage.get('input_tokens',0)
                stats[model]['output'] += usage.get('output_tokens',0)
                stats[model]['cache_read'] += usage.get('cache_read_input_tokens',0)
                stats[model]['cache_create'] += usage.get('cache_creation_input_tokens',0)
    except: pass

print(json.dumps({'hours': ${hours}, 'models': stats}))
`;
          const out = execSync(`python3 -c "${script.replace(/"/g, '\\"')}"`, { timeout: 15000 }).toString();
          res.end(out);
        } catch (e) {
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    },
  };
}

function alertDetailPlugin() {
  return {
    name: 'alert-detail',
    configureServer(server) {
      server.middlewares.use('/alert-detail', (req, res) => {
        const url = new URL(req.url, 'http://localhost');
        const type = url.searchParams.get('type') || '';
        res.setHeader('Content-Type', 'application/json');

        try {
          let items = [];

          if (type === 'hooks') {
            // stale hooks: beads issues that are HOOKED
            const out = execSync('bd list --status=open 2>/dev/null || true', {
              cwd: '/Users/dr.nogreasy/gt', timeout: 8000,
            }).toString();
            items = out.split('\n')
              .filter(l => l.includes('HOOKED') || l.includes('hooked'))
              .map(l => l.trim()).filter(Boolean);
            if (!items.length) {
              // fallback: list all open issues with hook keyword
              items = out.split('\n').filter(l => l.includes('hook')).map(l => l.trim()).filter(Boolean);
            }

          } else if (type === 'p1p2') {
            const out = execSync('bd list --status=open 2>/dev/null || true', {
              cwd: '/Users/dr.nogreasy/gt', timeout: 8000,
            }).toString();
            items = out.split('\n')
              .filter(l => /● P[12]\b/.test(l))
              .map(l => l.trim()).filter(Boolean);

          } else if (type === 'dead') {
            const out = execSync('bd list --status=open 2>/dev/null || true', {
              cwd: '/Users/dr.nogreasy/gt', timeout: 8000,
            }).toString();
            items = out.split('\n')
              .filter(l => /CRASHED|DEAD|dead|crash/i.test(l))
              .map(l => l.trim()).filter(Boolean);

          } else {
            // generic: return raw alert text passed as 'text' param
            items = [`未知警報類型: ${type}`];
          }

          res.end(JSON.stringify({ type, items }));
        } catch (e) {
          res.end(JSON.stringify({ type, items: [`錯誤: ${e.message}`] }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), usagePlugin(), alertDetailPlugin()],
  server: {
    port: 8081,
    proxy: {
      '/static': 'http://localhost:8084',
      '/events': { target: 'http://localhost:8084', ws: true },
      '/api': 'http://localhost:8084',
      '/gt-source': {
        target: 'http://localhost:8084',
        rewrite: (p) => p.replace(/^\/gt-source/, ''),
      },
    },
  },
})

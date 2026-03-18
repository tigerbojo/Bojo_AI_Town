import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync, spawn } from 'child_process'
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
          const out = execSync('npx ccusage@latest blocks --json --offline 2>/dev/null', {
            timeout: 15000,
            env: { ...process.env, PATH: '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin' },
          }).toString();
          res.end(out);
        } catch (e) {
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    },
  };
}

function claudeUsagePlugin() {
  return {
    name: 'claude-usage',
    configureServer(server) {
      server.middlewares.use('/claude-usage', (req, res) => {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        const claudePath = (() => {
          try { return execSync('which claude', { timeout: 3000 }).toString().trim(); } catch { return 'claude'; }
        })();

        const child = spawn(claudePath, ['--print', '/usage'], {
          cwd: '/tmp',
          env: { ...process.env, PATH: '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin' },
        });

        child.stdout.on('data', d => res.write(d));
        child.stderr.on('data', d => res.write(d));
        child.on('close', () => res.end());

        res.on('close', () => child.kill());
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
  plugins: [react(), usagePlugin(), claudeUsagePlugin(), alertDetailPlugin()],
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

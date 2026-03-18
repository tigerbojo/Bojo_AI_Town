import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

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
  plugins: [react(), alertDetailPlugin()],
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

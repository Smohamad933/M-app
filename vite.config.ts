import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { handleApiRequest } from './server/apiHandler.ts';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'html-dev-transform',
      transformIndexHtml(html, ctx) {
        if (ctx.server) {
          return html
            .replace(
              /<script type="module" crossorigin src="\.\/assets\/.*?"><\/script>/,
              '<script type="module" src="/src/main.tsx"></script>'
            )
            .replace(/<link rel="stylesheet" crossorigin href="\.\/assets\/.*?">/, '');
        }
        return html;
      },
    },
    react(),
    tailwindcss(),
    {
      name: 'api-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          try {
            const handled = await handleApiRequest(req, res);
            if (!handled) {
              next();
            }
          } catch (e) {
            console.error('API Error:', e);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
          }
        });
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
});

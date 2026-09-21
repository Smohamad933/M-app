import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleApiRequest } from './server/apiHandler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const urlPath = (req.url || '').split('?')[0];
          // In dev mode, always serve index.source.html with dynamic HMR transformation
          if (urlPath === '/' || urlPath === '/index.html') {
            try {
              const template = fs.readFileSync(path.resolve(__dirname, 'index.source.html'), 'utf-8');
              const transformed = await server.transformIndexHtml(req.url || '/', template);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              return res.end(transformed);
            } catch (err) {
              return next(err);
            }
          }

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

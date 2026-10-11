import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/vazirmatn/400.css'
import '@fontsource/vazirmatn/700.css'
import '@fontsource/cairo/400.css'
import '@fontsource/cairo/700.css'
import '@fontsource/rubik/400.css'
import '@fontsource/rubik/700.css'
import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/700.css'
import 'shabnam-font/dist/font-face.css'
import 'sahel-font/dist/font-face.css'
import 'samim-font/dist/font-face.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA: register the service worker in production builds only
// (dev server keeps HMR live; the deployed bundle gets offline support)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* offline support is progressive enhancement — ignore registration errors */
    })
  })
}

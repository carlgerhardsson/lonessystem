import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// ─── GLOBAL iOS SCROLL GUARD ──────────────────────────────────────────────────
// iOS Safari kan skifta window.scrollX horisontellt när ett input-fält i en
// position:fixed modal får fokus — även när html/body själva är position:fixed.
// Detta är ett känt Safari-fel utan ren CSS-lösning på alla iOS-versioner.
//
// Lösning: lyssna på varje 'scroll'-event på window och nollställ scrollX
// omedelbart om det avviker. Körs under hela appens livstid.
// Påverkar inte vertikal scroll (window.scrollY) och är extremt billig
// eftersom iOS sällan triggar horisontell scroll i en PWA.
window.addEventListener('scroll', () => {
  if (window.scrollX !== 0) {
    window.scrollTo(0, window.scrollY)
  }
}, { passive: true })

// Nollställ även vid touch-start — iOS kan skifta innan scroll-eventet ens avfyras
document.addEventListener('touchstart', () => {
  if (window.scrollX !== 0) {
    window.scrollTo(0, window.scrollY)
  }
}, { passive: true })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

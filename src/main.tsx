import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { LanguageProvider } from './i18n/LanguageContext'
import { AuthProvider } from './contexts/AuthContext'
import { KeyboardShortcutsProvider } from './hooks/useKeyboardShortcuts'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'
import App from './App.tsx'

// Register Service Worker for PWA only in production.
// In dev, an old SW can keep serving stale bundles and stale socket URLs.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}

if ('serviceWorker' in navigator && import.meta.env.DEV) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .then(() => caches.keys())
    .then((cacheNames) => Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName))))
    .catch((error) => {
      console.log('SW cleanup failed:', error);
    });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <LanguageProvider>
          <KeyboardShortcutsProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
            <Toaster theme="dark" position="top-right" richColors closeButton />
          </KeyboardShortcutsProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)

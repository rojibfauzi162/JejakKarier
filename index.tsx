
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error handler to help recover from blank screens
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global error caught:", message, error);
  // If it's a chunk load error, it's likely a stale cache issue
  if (message.toString().includes('Loading chunk') || message.toString().includes('CSS_CHUNK_LOAD_FAILED')) {
    localStorage.clear();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) registration.unregister();
      });
    }
    window.location.reload();
  }
};

console.log("[INDEX] Starting application...");
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("[INDEX] Could not find root element to mount to");
  throw new Error("Could not find root element to mount to");
}
console.log("[INDEX] Root element found, mounting React...");
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
console.log("[INDEX] React render called.");

// Register Service Worker for PWA (DISABLED TO FIX NETWORK ERRORS)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister();
        console.log('[SW] Unregistered existing Service Worker');
      }
    });
  });
}

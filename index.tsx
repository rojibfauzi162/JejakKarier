
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

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // UNREGISTER ALL SERVICE WORKERS TO FIX NETWORK ERRORS
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister();
        console.log('SW unregistered to clear cache');
      }
      
      // Register the new one after unregistering the old ones
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('SW registered: ', registration);
      }).catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
    });
  });
}

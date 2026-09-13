import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Automatically scroll active input into visible viewport above mobile virtual keyboard
if (typeof window !== 'undefined') {
  const handleFocus = (e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT')
    ) {
      // Delay slightly so mobile virtual keyboard has animated into place
      setTimeout(() => {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }, 300);
    }
  };

  window.addEventListener('focusin', handleFocus, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);


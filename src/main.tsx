import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';
import {AppErrorBoundary} from './AppErrorBoundary';
import {initAnalytics} from './analytics';
import {warmHeroAndReels} from './heroPreload';
import {SITE_NAME} from './brand';
import './index.css';

initAnalytics();
try {
  warmHeroAndReels();
} catch (err) {
  console.warn(`[${SITE_NAME}] hero preload skipped`, err);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>,
);

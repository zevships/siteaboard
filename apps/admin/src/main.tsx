import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { PreferencesProvider } from './providers/preferences.tsx';
import { router } from './app/router.tsx';
import './styles/tokens.css';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PreferencesProvider>
      <RouterProvider router={router} />
    </PreferencesProvider>
  </StrictMode>,
);

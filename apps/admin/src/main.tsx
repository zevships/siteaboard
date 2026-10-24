import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { PreferencesProvider } from './providers/preferences.tsx';
import { router } from './app/router.tsx';
import './styles/tokens.css';
import './styles/app.css';
import './styles/reference.css';
import './styles/polish.css';
import { WorkspaceProvider } from './providers/workspace.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PreferencesProvider>
      <WorkspaceProvider>
        <RouterProvider router={router} />
      </WorkspaceProvider>
    </PreferencesProvider>
  </StrictMode>,
);

import React, { useEffect } from 'react';
import { useAppSelector } from './app/hooks';
import { AppRoutes } from './routes/AppRoutes';

export function App() {
  const resolvedTheme = useAppSelector((state) => state.theme.resolvedTheme);

  // Keep data-theme synced with active theme state
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  return <AppRoutes />;
}

export default App;

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { toggleTheme } from '../../features/theme/themeSlice';

export const ThemeToggle: React.FC = () => {
  const dispatch = useAppDispatch();
  const resolvedTheme = useAppSelector((state) => state.theme.resolvedTheme);
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => dispatch(toggleTheme())}
      className="btn btn-icon btn-ghost"
      title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      aria-label="Toggle theme"
      style={{
        position: 'relative',
        overflow: 'hidden',
        color: isDark ? 'hsl(45, 100%, 65%)' : 'hsl(238, 82%, 55%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
          opacity: isDark ? 1 : 0,
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
          position: isDark ? 'relative' : 'absolute',
        }}
      >
        <Moon size={20} />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: !isDark ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0)',
          opacity: !isDark ? 1 : 0,
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
          position: !isDark ? 'relative' : 'absolute',
        }}
      >
        <Sun size={20} />
      </div>
    </button>
  );
};

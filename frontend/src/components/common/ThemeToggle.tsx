import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ showLabel = false, className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 cursor-pointer
        ${
          isDark
            ? 'bg-zinc-900 border border-zinc-800 text-yellow-400 hover:bg-zinc-800 hover:text-yellow-300 shadow-sm'
            : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900 shadow-sm'
        } ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Sun
          className={`w-4 h-4 absolute transition-all duration-300 transform ${
            isDark
              ? 'opacity-100 rotate-0 scale-100 text-amber-400'
              : 'opacity-0 -rotate-90 scale-0'
          }`}
        />
        <Moon
          className={`w-4 h-4 absolute transition-all duration-300 transform ${
            isDark
              ? 'opacity-0 rotate-90 scale-0'
              : 'opacity-100 rotate-0 scale-100 text-slate-700'
          }`}
        />
      </div>

      {showLabel && (
        <span className="ml-2 text-xs font-medium select-none">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}

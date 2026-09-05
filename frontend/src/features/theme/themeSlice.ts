import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
}

const getInitialMode = (): ThemeMode => {
  const saved = localStorage.getItem('app_theme') as ThemeMode;
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved;
  }
  return 'dark'; // High-end dark default
};

const resolveTheme = (mode: ThemeMode): 'light' | 'dark' => {
  if (mode === 'system') {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return mode;
};

const initialMode = getInitialMode();
const initialResolved = resolveTheme(initialMode);

// Apply immediately on load
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', initialResolved);
}

const initialState: ThemeState = {
  mode: initialMode,
  resolvedTheme: initialResolved,
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      state.resolvedTheme = resolveTheme(action.payload);
      localStorage.setItem('app_theme', action.payload);
      document.documentElement.setAttribute('data-theme', state.resolvedTheme);
    },
    toggleTheme: (state) => {
      const nextTheme = state.resolvedTheme === 'dark' ? 'light' : 'dark';
      state.mode = nextTheme;
      state.resolvedTheme = nextTheme;
      localStorage.setItem('app_theme', nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
    },
  },
});

export const { setThemeMode, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;

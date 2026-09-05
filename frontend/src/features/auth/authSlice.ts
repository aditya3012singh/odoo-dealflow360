import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthState } from '../../types/auth.types';

const getInitialAuth = (): { user: User | null; token: string | null } => {
  try {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    return {
      token: savedToken || null,
      user: savedUser ? JSON.parse(savedUser) : null,
    };
  } catch (e) {
    console.error('Error parsing stored auth credentials', e);
    return { token: null, user: null };
  }
};

const initialCredentials = getInitialAuth();

const initialState: AuthState = {
  user: initialCredentials.user,
  token: initialCredentials.token,
  isAuthenticated: Boolean(initialCredentials.token),
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string }>
    ) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.token = accessToken;
      state.isAuthenticated = true;
      state.error = null;

      try {
        localStorage.setItem('auth_token', accessToken);
        localStorage.setItem('auth_user', JSON.stringify(user));
      } catch (err) {
        console.error('Failed to store auth tokens in localStorage', err);
      }
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        try {
          localStorage.setItem('auth_user', JSON.stringify(state.user));
        } catch (err) {
          console.error('Failed to update auth_user in localStorage', err);
        }
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;

      try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } catch (err) {
        console.error('Failed to clear tokens from localStorage', err);
      }
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { setCredentials, updateUser, logout, setAuthLoading, setAuthError } =
  authSlice.actions;

export default authSlice.reducer;

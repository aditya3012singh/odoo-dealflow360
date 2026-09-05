import api from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    const { accessToken, user } = response.data.data;
    localStorage.setItem('accessToken', accessToken);
    return { accessToken, user };
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile');
    return response.data.data?.user || response.data.data;
  },

  logout() {
    localStorage.removeItem('accessToken');
    window.location.href = '/workspace';
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },
};

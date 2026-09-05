export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
}

export interface AuthSuccessData {
  user: User;
  accessToken: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

import { create } from 'zustand';
import { User, UserRole } from '../types';
import { api } from '../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  initAuth: () => Promise<void>;
  setDemoUser: (role: UserRole) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('rollnride_user') || 'null'),
  token: localStorage.getItem('rollnride_token'),
  isAuthenticated: !!localStorage.getItem('rollnride_token'),
  isLoading: false,
  initAuth: async () => {
    await get().checkAuth();
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await api.login(email, password);
      localStorage.setItem('rollnride_token', data.access_token);
      localStorage.setItem('rollnride_user', JSON.stringify(data.user));
      set({
        user: data.user,
        token: data.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('rollnride_token');
    localStorage.removeItem('rollnride_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('rollnride_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false });
      return;
    }
    try {
      const user = await api.getMe();
      localStorage.setItem('rollnride_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch {
      get().logout();
    }
  },

  setDemoUser: async (role: UserRole) => {
    const roleCredentials: Record<UserRole, { email: string; pass: string }> = {
      ADMIN: { email: 'admin@rollnride.com', pass: 'Admin123!' },
      OPERATIONS_MANAGER: { email: 'manager@rollnride.com', pass: 'Manager123!' },
      WAREHOUSE_MANAGER: { email: 'warehouse@rollnride.com', pass: 'Warehouse123!' },
      FLEET_MANAGER: { email: 'fleet@rollnride.com', pass: 'Fleet123!' },
      CUSTOMER: { email: 'customer@rollnride.com', pass: 'Customer123!' },
      STAFF: { email: 'staff1@rollnride.com', pass: 'Staff123!' },
    };

    const creds = roleCredentials[role];
    if (creds) {
      await get().login(creds.email, creds.pass);
    }
  }
}));

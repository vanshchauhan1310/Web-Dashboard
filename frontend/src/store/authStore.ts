import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  sub: string;
  email: string;
  full_name: string;
  company: string;
  dashboards: string[];
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  login: (token: string) => void;
  logout: () => void;
}

function parseJwt(token: string): AuthUser | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json) as AuthUser;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token: string) => {
        const user = parseJwt(token);
        set({ token, user });
      },
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'nexus-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

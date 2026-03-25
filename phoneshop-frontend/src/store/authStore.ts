import { create } from 'zustand';
import Cookies from 'js-cookie';

interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  avatar: string;
  role: string;
  isActive?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const getInitialUser = () => {
  if (typeof window !== 'undefined') {
    const saved = Cookies.get('user');
    return saved ? JSON.parse(saved) : null;
  }
  return null;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  isAuthenticated: !!Cookies.get('accessToken'),
  login: (user, accessToken, refreshToken) => {
    Cookies.set('accessToken', accessToken, { expires: 1 });
    Cookies.set('refreshToken', refreshToken, { expires: 7 });
    Cookies.set('user', JSON.stringify(user), { expires: 7 });
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('user');
    set({ user: null, isAuthenticated: false });
  },
  setUser: (user) => {
    Cookies.set('user', JSON.stringify(user), { expires: 7 });
    set({ user });
  },
}));

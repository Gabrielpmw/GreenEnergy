import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  nome: string
  email: string
  role: 'Admin' | 'Operador' | 'Cliente'
}

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: User | null
  login: (token: string, refreshToken: string, user: User) => void
  logout: () => void
  setToken: (token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      login: (token, refreshToken, user) => set({ token, refreshToken, user }),
      logout: () => set({ token: null, refreshToken: null, user: null }),
      setToken: (token) => set({ token }),
    }),
    {
      name: 'green-energy-auth',
    }
  )
)

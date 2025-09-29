import { create } from 'zustand'
import { User, getCurrentUser, clearCurrentUser } from './auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  initializeAuth: () => void
  setUser: (user: User | null) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  
  initializeAuth: () => {
    try {
      const user = getCurrentUser()
      set({
        user,
        isAuthenticated: !!user,
        isLoading: false
      })
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  },
  
  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user
    })
  },
  
  signOut: () => {
    clearCurrentUser()
    set({
      user: null,
      isAuthenticated: false
    })
  }
}))

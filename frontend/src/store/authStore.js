import { create } from 'zustand'
import apiClient from '../lib/axios'
import axios from 'axios'

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: true,
  isLoginOpen: false,
  setIsLoginOpen: (val) => set({ isLoginOpen: val }),

  setAuth: (tokens, user = null) => {
    if (tokens.access) {
      localStorage.setItem('access_token', tokens.access)
      localStorage.setItem('refresh_token', tokens.refresh)
      set({
        accessToken: tokens.access,
        refreshToken: tokens.refresh,
        isAuthenticated: true,
        user: user || get().user,
      })
    }
  },

  updateUser: (user) => {
    set({ user })
  },

  login: async (email, password) => {
    set({ loading: true })
    try {
      const res = await apiClient.post('/api/auth/login/', { email, password })
      const { tokens, user } = res.data
      localStorage.setItem('access_token', tokens.access)
      localStorage.setItem('refresh_token', tokens.refresh)
      set({
        accessToken: tokens.access,
        refreshToken: tokens.refresh,
        isAuthenticated: true,
        user,
        loading: false,
      })
      return { success: true }
    } catch (err) {
      set({ loading: false })
      const errorMsg = err.response?.data?.error || 'Invalid credentials'
      return { success: false, error: errorMsg }
    }
  },

  register: async ({ email, username, password, confirmPassword, role, firstName, lastName }) => {
    set({ loading: true })
    try {
      const res = await apiClient.post('/api/auth/register/', {
        email,
        username,
        password,
        confirm_password: confirmPassword,
        role: role || 'user',
        first_name: firstName || '',
        last_name: lastName || '',
      })
      const { tokens, user } = res.data
      localStorage.setItem('access_token', tokens.access)
      localStorage.setItem('refresh_token', tokens.refresh)
      set({
        accessToken: tokens.access,
        refreshToken: tokens.refresh,
        isAuthenticated: true,
        user,
        loading: false,
      })
      return { success: true }
    } catch (err) {
      set({ loading: false })
      const errorMsg = err.response?.data?.error || 'Registration failed. Please try again.'
      return { success: false, error: errorMsg }
    }
  },

  logout: async () => {
    const refresh = get().refreshToken
    if (refresh) {
      try {
        await apiClient.post('/api/auth/logout/', { refresh }, {
          headers: { Authorization: `Bearer ${get().accessToken}` }
        })
      } catch (e) {
        console.error("Logout request error", e)
      }
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: false,
    })
  },

  initAuth: async () => {
    set({ loading: true })
    const access = localStorage.getItem('access_token')
    if (access) {
      try {
        const res = await apiClient.get('/api/auth/me/', {
          headers: { Authorization: `Bearer ${access}` }
        })
        set({ user: res.data, isAuthenticated: true, loading: false })
      } catch (err) {
        // Access token expired, try refreshing
        const refresh = localStorage.getItem('refresh_token')
        if (refresh) {
          try {
            const baseURL = import.meta.env.VITE_API_URL || ''
            const res = await axios.post(`${baseURL}/api/auth/token/refresh/`, { refresh })
            const newAccess = res.data.access
            localStorage.setItem('access_token', newAccess)
            
            // Get user profile
            const profileRes = await apiClient.get('/api/auth/me/', {
              headers: { Authorization: `Bearer ${newAccess}` }
            })
            set({
              accessToken: newAccess,
              user: profileRes.data,
              isAuthenticated: true,
              loading: false,
            })
          } catch (refreshErr) {
            get().logout()
          }
        } else {
          get().logout()
        }
      }
    } else {
      set({ user: null, isAuthenticated: false, loading: false })
    }
  }
}))

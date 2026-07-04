import axios from 'axios'

// Configured for cloud deployments
const apiClient = axios.create({
  // Hardcoding the production Render URL to bypass Vercel environment variable issues
  baseURL: import.meta.env.VITE_API_URL || 'https://sessionly-2weo.onrender.com',
})

// Automatically attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Automatically refresh token on 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        const baseURL = import.meta.env.VITE_API_URL || 'https://sessionly-2weo.onrender.com'
        const res = await axios.post(`${baseURL}/api/auth/token/refresh/`, { refresh })
        localStorage.setItem('access_token', res.data.access)
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`
        return apiClient(originalRequest)
      } catch (err) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/?error=session_expired'
        return Promise.reject(err)
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient

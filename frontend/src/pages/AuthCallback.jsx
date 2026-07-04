import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth, initAuth } = useAuthStore()
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'

  useEffect(() => {
    const processTokens = async () => {
      // Check for error from OAuth provider or backend
      const errorParam = searchParams.get('error')
      if (errorParam) {
        const errorMessages = {
          not_authenticated: 'Google did not authenticate you. Please try again.',
          access_denied: 'You denied access. Please try again to log in.',
          invalid_state: 'Session expired. Please start the login process again.',
        }
        setError(errorMessages[errorParam] || `Authentication error: ${errorParam}. Please try again.`)
        setStatus('error')
        return
      }

      const accessToken = searchParams.get('access')
      const refreshToken = searchParams.get('refresh')

      if (!accessToken || !refreshToken) {
        setError('Authentication tokens not found. Please try logging in again.')
        setStatus('error')
        return
      }

      try {
        // 1. Store tokens in Zustand + localStorage
        setAuth({ access: accessToken, refresh: refreshToken })

        // 2. Fetch user profile
        await initAuth()

        // 3. Read updated user from store
        const userObj = useAuthStore.getState().user

        setStatus('success')
        toast.success(`Welcome back, ${userObj?.first_name || userObj?.username || 'there'}!`)

        // 4. Redirect after brief success display
        setTimeout(() => {
          if (userObj?.role === 'creator') {
            navigate('/dashboard/creator', { replace: true })
          } else {
            navigate('/dashboard/user', { replace: true })
          }
        }, 1200)
      } catch (err) {
        setError('Failed to initialize your session. Please try again.')
        setStatus('error')
      }
    }

    processTokens()
  }, [searchParams])

  // ── Error State ──────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 mb-6">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-3">
            Sign-In Failed
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
            {error}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'https://sessionly-2weo.onrender.com'}/api/social/login/google-oauth2/`}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:brightness-110 transition-all shadow-md"
            >
              <RefreshCw size={15} />
              <span>Try Google Again</span>
            </button>
            <Link
              to="/"
              className="flex items-center space-x-2 px-6 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
            >
              <Home size={15} />
              <span>Back to Home</span>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Success State ────────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl"
            >
              ✓
            </motion.div>
          </div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
            Authenticated!
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Redirecting to your dashboard…
          </p>
        </motion.div>
      </div>
    )
  }

  // ── Loading State ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-4 animate-pulse">
        Completing secure handshake, please wait…
      </p>
    </div>
  )
}

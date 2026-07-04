import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Sun, Moon, LogOut, LayoutDashboard, User as UserIcon, Menu, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar() {
  const { user, logout, isAuthenticated, login, register, isLoginOpen, setIsLoginOpen } = useAuthStore()
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark')
  const [isOpen, setIsOpen] = useState(false)
  
  // Modal tab: 'login' | 'register'
  const [activeModalTab, setActiveModalTab] = useState('login')

  // Login states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Register states
  const [regEmail, setRegEmail] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regFirstName, setRegFirstName] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [regRole, setRegRole] = useState('user')
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  useEffect(() => {
    const root = window.document.documentElement
    if (darkMode) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  // Autofill function removed for production

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/')
    setIsOpen(false)
  }

  const handleLocalLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    const res = await login(email, password)
    setLoginLoading(false)
    if (res.success) {
      toast.success('Logged in successfully!')
      setIsLoginOpen(false)
      setEmail('')
      setPassword('')
    } else {
      setLoginError(res.error)
      toast.error(res.error)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setRegError('')
    // Client-side validation
    if (regPassword.length < 8) {
      setRegError('Password must be at least 8 characters.')
      return
    }
    if (regPassword !== regConfirm) {
      setRegError('Passwords do not match.')
      return
    }
    setRegLoading(true)
    const res = await register({
      email: regEmail, username: regUsername, password: regPassword,
      confirmPassword: regConfirm, role: regRole,
      firstName: regFirstName,
    })
    setRegLoading(false)
    if (res.success) {
      toast.success('Account created! Welcome to Sessionly 🎉')
      setIsLoginOpen(false)
      setRegEmail(''); setRegUsername(''); setRegPassword(''); setRegConfirm('')
    } else {
      setRegError(res.error)
    }
  }

  return (
    <>
      <nav className="glass-nav border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 font-sans">
                SESSIONLY
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  to={user?.role === 'creator' ? '/dashboard/creator' : '/dashboard/user'}
                  className="flex items-center space-x-1.5 text-sm font-medium text-zinc-700 hover:text-primary dark:text-zinc-300 dark:hover:text-primary transition-colors"
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center space-x-1.5 text-sm font-medium text-zinc-700 hover:text-primary dark:text-zinc-300 dark:hover:text-primary transition-colors"
                >
                  <UserIcon size={16} />
                  <span>Profile</span>
                </Link>
                <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700"></div>
                <div className="flex items-center space-x-2">
                  <img
                    src={user?.display_avatar}
                    alt={user?.username}
                    className="h-8 w-8 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                      {user?.first_name || user?.username}
                    </span>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                      {user?.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950"
          >
            <div className="px-4 pt-2 pb-4 space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl mb-4">
                    <img
                      src={user?.display_avatar}
                      alt={user?.username}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {user?.first_name || user?.username}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
                        {user?.role}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={user?.role === 'creator' ? '/dashboard/creator' : '/dashboard/user'}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-2 p-3 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <LayoutDashboard size={18} />
                    <span className="text-sm font-semibold">Dashboard</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-2 p-3 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <UserIcon size={18} />
                    <span className="text-sm font-semibold">Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full p-3 text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-left"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-semibold">Logout</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 pt-2">
                  <button
                    onClick={() => { setIsOpen(false); setIsLoginOpen(true); }}
                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-xl text-center shadow-md"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>

    {/* Premium Login Modal */}
      <AnimatePresence>
        {isLoginOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoginOpen(false)}
              className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-0"
            />

            {/* Modal Centering Wrapper */}
            <div className="flex min-h-full items-center justify-center p-4 md:p-6 z-10 relative">
              {/* Modal Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-8 shadow-2xl transition-all font-sans"
              >
                {/* Decorative gradient blob */}
                <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-violet-600/10 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-indigo-650/10 blur-2xl pointer-events-none" />

                {/* Tab Switcher */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => { setActiveModalTab('login'); setLoginError(''); setRegError('') }}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        activeModalTab === 'login'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                    >Sign In</button>
                    <button
                      type="button"
                      onClick={() => { setActiveModalTab('register'); setLoginError(''); setRegError('') }}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        activeModalTab === 'register'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                    >Register</button>
                  </div>
                  <button
                    onClick={() => setIsLoginOpen(false)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* ── LOGIN TAB ── */}
                {activeModalTab === 'login' && (
                  <>
                    {/* Quick autofill helpers removed for production */}

                    {loginError && (
                      <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3.5 text-xs font-medium text-red-600 dark:text-red-400">
                        ⚠ {loginError}
                      </div>
                    )}

                    <form onSubmit={handleLocalLogin} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Email Address</label>
                        <input type="email" required placeholder="your@email.com" value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Password</label>
                        <input type="password" required placeholder="Enter your password" value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all" />
                      </div>
                      <button type="submit" disabled={loginLoading}
                        className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-3 text-sm font-bold shadow-md transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                        {loginLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
                      </button>
                      <p className="text-center text-xs text-zinc-400">
                        No account?{' '}
                        <button type="button" onClick={() => setActiveModalTab('register')}
                          className="text-violet-600 dark:text-violet-400 font-bold hover:underline">Register free</button>
                      </p>
                    </form>

                    <div className="relative my-5">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200 dark:border-zinc-800" /></div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-450 dark:text-zinc-500 font-semibold tracking-wider">Or continue with</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Real Google OAuth link — triggers social-django handshake */}
                      <a
                        href="/api/social/login/google-oauth2/"
                        className="flex items-center justify-center space-x-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        <span>Google</span>
                      </a>
                      <a href="/api/social/login/github/"
                        className="flex items-center justify-center space-x-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 py-2.5 text-sm font-medium transition-colors">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16">
                          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                        </svg>
                        <span>GitHub</span>
                      </a>
                    </div>
                  </>
                )}

                {/* ── REGISTER TAB ── */}
                {activeModalTab === 'register' && (
                  <>
                    {regError && (
                      <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3.5 text-xs font-medium text-red-600 dark:text-red-400">
                        ⚠ {regError}
                      </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">First Name</label>
                          <input type="text" placeholder="Jane" value={regFirstName}
                            onChange={(e) => setRegFirstName(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Username</label>
                          <input type="text" required placeholder="janedoe" value={regUsername}
                            onChange={(e) => setRegUsername(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Email Address</label>
                        <input type="email" required placeholder="jane@example.com" value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Password</label>
                          <input type="password" required placeholder="Min 8 chars" value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className={`w-full rounded-xl border bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-1 outline-none transition-all ${
                              regPassword && regPassword.length < 8 ? 'border-red-400 focus:ring-red-400' : 'border-zinc-200 dark:border-zinc-800 focus:border-violet-500 focus:ring-violet-500'
                            }`} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Confirm</label>
                          <input type="password" required placeholder="Repeat password" value={regConfirm}
                            onChange={(e) => setRegConfirm(e.target.value)}
                            className={`w-full rounded-xl border bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-1 outline-none transition-all ${
                              regConfirm && regConfirm !== regPassword ? 'border-red-400 focus:ring-red-400' : 'border-zinc-200 dark:border-zinc-800 focus:border-violet-500 focus:ring-violet-500'
                            }`} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">I want to</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[['user','📚 Learn (Attendee)'],['creator','🎓 Teach (Creator)']].map(([val, lbl]) => (
                            <button key={val} type="button" onClick={() => setRegRole(val)}
                              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                                regRole === val ? 'bg-violet-600 border-violet-600 text-white' : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-violet-400'
                              }`}>{lbl}</button>
                          ))}
                        </div>
                      </div>
                      <button type="submit" disabled={regLoading}
                        className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-3 text-sm font-bold shadow-md transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-1">
                        {regLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create My Account'}
                      </button>
                      <p className="text-center text-xs text-zinc-400">
                        Already have an account?{' '}
                        <button type="button" onClick={() => setActiveModalTab('login')}
                          className="text-violet-600 dark:text-violet-400 font-bold hover:underline">Sign in</button>
                      </p>
                    </form>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

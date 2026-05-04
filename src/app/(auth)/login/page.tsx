'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Factory, BarChart3, Shield, Zap, ArrowRight, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'

function LoginForm() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [signupUsername, setSignupUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const result = await signIn('credentials', {
      login,
      password,
      redirect: false,
    })

    if (result?.error) {
      const messages: Record<string, string> = {
        missing_credentials: 'Username/email and password are required',
        invalid_credentials: 'Invalid username/email or password',
        account_disabled: 'Your account has been deactivated. Contact an administrator.',
        no_password_set: 'Please use Google sign-in or reset your password',
        CredentialsSignin: 'Invalid username/email or password',
      }
      const key = (result.code as string | undefined) ?? result.error
      setError(messages[key] ?? 'Sign-in failed. Please try again.')
      setIsLoading(false)
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: login, password, fullName, username: signupUsername }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create account')
        setIsLoading(false)
        return
      }

      setSuccess('Account created! You can now sign in.')
      setIsSignUp(false)
      setIsLoading(false)
    } catch {
      setError('Failed to create account')
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)
    await signIn('google', { callbackUrl })
  }

  const features = [
    { icon: Factory, title: 'Production Tracking' },
    { icon: BarChart3, title: 'Analytics Dashboard' },
    { icon: Shield, title: 'Quality Control' },
    { icon: Zap, title: 'Approval Workflows' },
  ]

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side - Marketing */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />

          {/* Large floating orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute top-10 right-1/3 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

          {/* Animated geometric shapes */}
          <div className="absolute top-20 right-20 w-40 h-40 border border-white/10 rounded-full animate-spin-slow" />
          <div className="absolute top-24 right-24 w-32 h-32 border border-cyan-500/20 rounded-full animate-spin-reverse" />
          <div className="absolute bottom-32 left-20 w-24 h-24 border border-blue-400/20 rounded-lg animate-spin-slow rotate-45" style={{ animationDuration: '25s' }} />
          <div className="absolute top-1/3 right-10 w-16 h-16 border-2 border-cyan-400/10 animate-pulse-scale" />

          {/* Floating lines */}
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-slide-right" />
          <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-slide-left" />
          <div className="absolute top-1/2 left-0 w-2/3 h-px bg-gradient-to-r from-cyan-500/30 to-transparent animate-slide-right" style={{ animationDelay: '2s' }} />

          {/* Pulsing dots grid */}
          <div className="absolute top-20 left-20 w-2 h-2 bg-cyan-400/40 rounded-full animate-pulse-dot" />
          <div className="absolute top-40 left-32 w-1.5 h-1.5 bg-blue-400/40 rounded-full animate-pulse-dot" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-60 left-16 w-2 h-2 bg-white/30 rounded-full animate-pulse-dot" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-40 left-40 w-1.5 h-1.5 bg-cyan-300/40 rounded-full animate-pulse-dot" style={{ animationDelay: '1.5s' }} />
          <div className="absolute bottom-20 left-24 w-2 h-2 bg-indigo-400/40 rounded-full animate-pulse-dot" style={{ animationDelay: '2s' }} />

          {/* Rising particles */}
          <div className="absolute bottom-0 left-1/4 w-1 h-1 bg-cyan-400/60 rounded-full animate-rise" />
          <div className="absolute bottom-0 left-1/3 w-1.5 h-1.5 bg-blue-400/50 rounded-full animate-rise" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-white/40 rounded-full animate-rise" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-0 left-2/3 w-1.5 h-1.5 bg-cyan-300/50 rounded-full animate-rise" style={{ animationDelay: '3s' }} />
          <div className="absolute bottom-0 left-3/4 w-1 h-1 bg-indigo-400/50 rounded-full animate-rise" style={{ animationDelay: '4s' }} />

          {/* Gradient sweeps */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-sweep" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-sweep-vertical" />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-transparent" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/10 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          {/* Logo & Brand */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl shadow-lg shadow-blue-500/30">
                <Factory className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl xl:text-4xl font-bold text-white tracking-tight">
                ProdLink
              </h1>
            </div>
            <p className="text-lg text-blue-100/70 font-light max-w-md leading-relaxed">
              Intelligent production data collection and analytics for modern factories
            </p>
          </div>

          {/* Features - Horizontal */}
          <div className="flex flex-wrap gap-3 mb-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10"
              >
                <feature.icon className="w-4 h-4 text-cyan-300" />
                <span className="text-sm text-white/80 font-medium">{feature.title}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8">
            <div>
              <div className="text-2xl font-bold text-white">99.9%</div>
              <div className="text-xs text-blue-200/50 uppercase tracking-wide">Uptime</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <div className="text-2xl font-bold text-white">50k+</div>
              <div className="text-xs text-blue-200/50 uppercase tracking-wide">Entries/day</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-xs text-blue-200/50 uppercase tracking-wide">Monitoring</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-[42%] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 lg:p-8 relative overflow-hidden">
        {/* Subtle background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl" />
        </div>

        <div className="w-full max-w-sm relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg">
                <Factory className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">ProdLink</h1>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white mb-1">
              {isSignUp ? 'Create Account' : 'Welcome back'}
            </h2>
            <p className="text-sm text-slate-400">
              {isSignUp ? 'Start your production journey' : 'Enter your credentials to continue'}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm backdrop-blur-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm backdrop-blur-sm">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={isSignUp ? handleSignUp : handleEmailLogin} className="space-y-3">
            {isSignUp && (
              <>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full ps-10 pe-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all disabled:bg-slate-800/30 disabled:text-slate-500"
                    placeholder="Full name"
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    id="signupUsername"
                    type="text"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    required
                    minLength={3}
                    disabled={isLoading}
                    className="w-full ps-10 pe-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all disabled:bg-slate-800/30 disabled:text-slate-500"
                    placeholder="Username"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <input
                id="login"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                disabled={isLoading}
                className="w-full ps-10 pe-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all disabled:bg-slate-800/30 disabled:text-slate-500"
                placeholder={isSignUp ? 'Email address' : 'Username or email'}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <Lock className="w-4 h-4 text-slate-500" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
                className="w-full ps-10 pe-10 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all disabled:bg-slate-800/30 disabled:text-slate-500"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-semibold rounded-lg shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isSignUp ? 'Creating...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Sign in'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Sign Up/Sign In */}
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
                setSuccess(null)
              }}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {isSignUp ? (
                <>Have an account? <span className="font-semibold text-cyan-400">Sign in</span></>
              ) : (
                <>Need an account? <span className="font-semibold text-cyan-400">Sign up</span></>
              )}
            </button>
          </div>

          {/* Divider - Hidden for now since Google isn't configured */}
          {/* <div className="my-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div> */}

          {/* Google Sign In - Hidden until configured */}
          {/* <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300 font-medium hover:bg-slate-700/50 hover:border-slate-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-600 disabled:bg-slate-800/30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button> */}

          {/* Footer */}
          <p className="mt-4 text-center text-xs text-slate-500">
            First user becomes admin automatically
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

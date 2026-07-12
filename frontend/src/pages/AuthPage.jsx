import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp, confirmSignUp, forgotPassword, confirmForgotPassword, getToken } from '../utils/auth.js'

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'confirm' | 'forgot' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getToken().then(token => { if (token) navigate('/', { replace: true }) })
  }, [navigate])

  function switchMode(next) {
    setMode(next)
    setError('')
  }

  async function handleSignIn(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(email, password)
      setMode('confirm')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await confirmSignUp(email, code)
      await signIn(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email)
      setMode('reset')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await confirmForgotPassword(email, code, password)
      await signIn(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Imagify</div>

        {mode === 'forgot' ? (
          <>
            <h2 className="auth-title">Reset password</h2>
            <p className="auth-subtitle">
              Enter your email and we'll send you a reset code
            </p>
            <form onSubmit={handleForgot} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  required
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset code'}
              </button>
            </form>
            <div className="auth-switch">
              Remembered it? <button type="button" onClick={() => switchMode('signin')}>Sign in</button>
            </div>
          </>
        ) : mode === 'reset' ? (
          <>
            <h2 className="auth-title">Choose a new password</h2>
            <p className="auth-subtitle">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
            <form onSubmit={handleReset} className="auth-form">
              <div className="form-group">
                <label>Verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="123456"
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label>New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 8 chars, upper, number, symbol"
                  required
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                {loading ? 'Resetting…' : 'Reset password & sign in'}
              </button>
            </form>
            <div className="auth-switch">
              Didn't get a code? <button type="button" onClick={() => switchMode('forgot')}>Try again</button>
            </div>
          </>
        ) : mode === 'confirm' ? (
          <>
            <h2 className="auth-title">Check your email</h2>
            <p className="auth-subtitle">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
            <form onSubmit={handleConfirm} className="auth-form">
              <div className="form-group">
                <label>Verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="123456"
                  autoFocus
                  required
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                {loading ? 'Verifying…' : 'Verify & sign in'}
              </button>
            </form>
            <div className="auth-switch">
              Wrong email? <button type="button" onClick={() => switchMode('signup')}>Go back</button>
            </div>
          </>
        ) : (
          <>
            <h2 className="auth-title">
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </h2>
            <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min 8 chars, upper, number, symbol' : '••••••••'}
                  required
                />
              </div>
              {mode === 'signin' && (
                <button type="button" className="auth-forgot-link" onClick={() => switchMode('forgot')}>
                  Forgot password?
                </button>
              )}
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                {loading
                  ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
                  : (mode === 'signin' ? 'Sign in' : 'Create account')}
              </button>
            </form>
            <div className="auth-switch">
              {mode === 'signin' ? (
                <>Don't have an account? <button type="button" onClick={() => switchMode('signup')}>Sign up</button></>
              ) : (
                <>Already have an account? <button type="button" onClick={() => switchMode('signin')}>Sign in</button></>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

import { lazy, Suspense, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SkeletonCard from './components/SkeletonCard.jsx'
import { getToken } from './utils/auth.js'

const Home = lazy(() => import('./pages/Home.jsx'))
const AuthPage = lazy(() => import('./pages/AuthPage.jsx'))

function PageSkeleton() {
  return (
    <div className="image-grid" style={{ padding: 24 }}>
      {Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}

function AuthGuard({ children }) {
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    getToken().then(token => {
      setAuthed(!!token)
      setChecking(false)
    })
  }, [])

  if (checking) return <PageSkeleton />
  if (!authed) return <Navigate to="/auth" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

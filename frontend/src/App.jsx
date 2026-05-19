import { lazy, Suspense } from 'react'
import SkeletonCard from './components/SkeletonCard.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))

function PageSkeleton() {
  return (
    <div className="image-grid" style={{ padding: 24 }}>
      {Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Home />
    </Suspense>
  )
}

'use client'

import { Suspense } from 'react'
import { ErrorBoundary, LoadingSpinner, AuthError } from '@/components/ErrorBoundary'
import { Header } from '@/components/layout/Header'
import CleanMatrix from '@/components/CleanMatrix'
import { useAuthProfile } from '@/hooks/useAuthProfile'

function MatrixContent() {
  const { user, profile, loading, profileError } = useAuthProfile()

  if (profileError) {
    return <AuthError error={profileError} onRetry={() => window.location.reload()} />
  }

  if (loading) {
    return <LoadingSpinner message="טוען מטריקס מחירים..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🗄️ בשרומטר V3 - פלטפורמת הקהילה
            </h1>
            <p className="text-gray-600">
              השוואת מחירי בשר מתקדמת עם דיווחים קהילתיים ומבצעים
            </p>
            {user && (
              <p className="text-sm text-green-600 mt-2">
                👋 שלום {profile?.full_name || user.email}
              </p>
            )}
          </div>
          
          <ErrorBoundary>
            <CleanMatrix />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}

export default function HomePage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner message="טוען אפליקציה..." />}>
        <MatrixContent />
      </Suspense>
    </ErrorBoundary>
  )
}
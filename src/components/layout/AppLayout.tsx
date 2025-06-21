'use client'

import { ReactNode } from 'react'
import { NavBar } from '@/components/navigation/NavBar'
import { Header } from './Header'

interface AppLayoutProps {
  children: ReactNode
  showOldHeader?: boolean // For gradual migration
}

export function AppLayout({ children, showOldHeader = false }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Choose between old and new navigation */}
      {showOldHeader ? (
        <Header />
      ) : (
        <NavBar />
      )}
      
      {/* Main Content */}
      <main className="relative">
        {children}
      </main>
      
      {/* Footer Spacer */}
      <div className="h-16" />
    </div>
  )
}

export default AppLayout
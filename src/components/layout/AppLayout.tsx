'use client'

import { ReactNode } from 'react'
import { NavBar } from '@/components/navigation/NavBar'
import { Header } from './Header'
import TestModal from '@/components/test/TestModal'
import SimpleAuthTest from '@/components/test/SimpleAuthTest'
import StandaloneModalTest from '@/components/test/StandaloneModalTest'

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
      
      {/* Test Modal for Debugging */}
      <TestModal />
      
      {/* Simple Auth Test for Debugging */}
      <SimpleAuthTest />
      
      {/* Standalone Modal Test for Debugging */}
      <StandaloneModalTest />
    </div>
  )
}

export default AppLayout
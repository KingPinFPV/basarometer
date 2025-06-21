'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface ModalErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ModalErrorBoundaryProps {
  children: React.ReactNode
}

class ModalErrorBoundary extends React.Component<ModalErrorBoundaryProps, ModalErrorBoundaryState> {
  constructor(props: ModalErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ModalErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for monitoring (in production, send to monitoring service)
    console.error('Modal system error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="card max-w-md w-full text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">שגיאה במערכת החלונות</h2>
            <p className="text-gray-600 mb-4">אירעה שגיאה בלתי צפויה. אנא רענן את הדף.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              רענן דף
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export { ModalErrorBoundary }
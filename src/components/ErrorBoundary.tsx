'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
          <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
            <div className="text-6xl mb-4">🚨</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              שגיאה בטעינת המערכת
            </h1>
            <p className="text-gray-600 mb-6">
              אירעה שגיאה בטעינת בשרומטר. אנא נסה את הפתרונות הבאים:
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.reload()
                  }
                }}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                🔄 רענן דף
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    try {
                      // Clear all cookies and localStorage
                      document.cookie.split(";").forEach(c => {
                        const eqPos = c.indexOf("=")
                        const name = eqPos > -1 ? c.substr(0, eqPos) : c
                        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname
                        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
                      })
                      localStorage.clear()
                      sessionStorage.clear()
                    } catch (e) {
                      console.error('Error clearing storage:', e)
                    }
                    window.location.reload()
                  }
                }}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 transition-colors"
              >
                🧹 נקה עוגיות ורענן
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                🔙 חזור למערכת
              </button>
            </div>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  פרטי שגיאה טכניים
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded text-red-600 overflow-auto max-h-32">
                  {this.state.error.message}
                  {this.state.error.stack && '\n\n' + this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="mt-6 text-xs text-gray-500">
              אם הבעיה נמשכת, נסה לנקות עוגיות או פנה לתמיכה טכנית
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional error fallback component
export function AuthError({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-red-600 mb-4">שגיאת אימות</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <div className="space-y-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              נסה שוב
            </button>
          )}
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload()
              }
            }}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            רענן דף
          </button>
        </div>
      </div>
    </div>
  )
}

// Loading spinner component
export function LoadingSpinner({ message = "טוען..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}
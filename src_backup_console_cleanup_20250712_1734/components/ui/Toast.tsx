'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react'

export interface ToastData {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message?: string
  duration?: number
}

interface ToastProps {
  toast: ToastData
  onClose: (id: string) => void
}

function Toast({ toast, onClose }: ToastProps) {
  const { id, type, title, message, duration = 5000 } = toast

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />
      default:
        return <Info className="w-6 h-6 text-blue-500" />
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  return (
    <div
      className={`max-w-sm w-full ${getStyles()} border rounded-lg shadow-lg pointer-events-auto animate-fade-in`}
      dir="rtl"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="mr-3 w-0 flex-1">
            <p className="text-sm font-semibold">{title}</p>
            {message && <p className="mt-1 text-sm opacity-90">{message}</p>}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onClose(id)}
              className="rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastData[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-0 right-0 z-50 p-6 space-y-4 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  )
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([])
  const [counter, setCounter] = useState(0)

  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const id = `toast-${Date.now()}-${counter}`
    setCounter(prev => prev + 1)
    setToasts((prev) => [...prev, { ...toast, id }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const success = (title: string, message?: string, duration?: number) => {
    addToast({ type: 'success', title, message, duration })
  }

  const error = (title: string, message?: string, duration?: number) => {
    addToast({ type: 'error', title, message, duration })
  }

  const info = (title: string, message?: string, duration?: number) => {
    addToast({ type: 'info', title, message, duration })
  }

  return {
    toasts,
    removeToast,
    success,
    error,
    info
  }
}
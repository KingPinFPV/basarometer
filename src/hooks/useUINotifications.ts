'use client'

import { useState, useCallback } from 'react'
import { useToast } from '../components/ui/Toast'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
}

interface InputOptions {
  title: string
  message: string
  placeholder?: string
  defaultValue?: string
  confirmText?: string
  cancelText?: string
  required?: boolean
}

interface ConfirmDialogState {
  isOpen: boolean
  options: ConfirmOptions
  onConfirm: () => void
}

interface InputDialogState {
  isOpen: boolean
  options: InputOptions
  onConfirm: (value: string) => void
}

export function useUINotifications() {
  const toast = useToast()
  
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    options: { title: '', message: '' },
    onConfirm: () => {}
  })

  const [inputDialog, setInputDialog] = useState<InputDialogState>({
    isOpen: false,
    options: { title: '', message: '' },
    onConfirm: () => {}
  })

  // Toast notifications (replaces alert)
  const showSuccess = useCallback((message: string, title?: string) => {
    toast.success(title || 'הצלחה', message)
  }, [toast])

  const showError = useCallback((message: string, title?: string) => {
    toast.error(title || 'שגיאה', message)
  }, [toast])

  const showInfo = useCallback((message: string, title?: string) => {
    toast.info(title || 'מידע', message)
  }, [toast])

  // Confirmation dialog (replaces confirm)
  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        isOpen: true,
        options,
        onConfirm: () => {
          resolve(true)
          setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        }
      })
    })
  }, [])

  const closeConfirm = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }))
  }, [])

  // Input dialog (replaces prompt)
  const showInput = useCallback((options: InputOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setInputDialog({
        isOpen: true,
        options,
        onConfirm: (value: string) => {
          resolve(value)
          setInputDialog(prev => ({ ...prev, isOpen: false }))
        }
      })
    })
  }, [])

  const closeInput = useCallback(() => {
    setInputDialog(prev => ({ ...prev, isOpen: false }))
  }, [])

  return {
    // Toast methods
    showSuccess,
    showError,
    showInfo,
    
    // Confirmation dialog
    showConfirm,
    confirmDialog,
    closeConfirm,
    
    // Input dialog
    showInput,
    inputDialog,
    closeInput,
    
    // Toast state for rendering
    toasts: toast.toasts,
    removeToast: toast.removeToast
  }
}
'use client'

import React from 'react'
import { createPortal } from 'react-dom'

interface ModalPortalProps {
  children: React.ReactNode
  isOpen: boolean
}

export function ModalPortal({ children, isOpen }: ModalPortalProps) {
  // Don't render anything if modal is closed
  if (!isOpen) return null
  
  // Ensure we're in browser environment
  if (typeof window === 'undefined') return null
  
  // Render directly to document.body - escapes any container constraints
  return createPortal(
    <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50" dir="rtl">
      {children}
    </div>,
    document.body
  )
}
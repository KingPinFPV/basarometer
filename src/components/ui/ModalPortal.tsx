'use client'

import React, { useCallback } from 'react'
import { createPortal } from 'react-dom'

interface ModalPortalProps {
  children: React.ReactNode
  isOpen: boolean
}

const ModalPortal = React.memo(function ModalPortal({ children, isOpen }: ModalPortalProps) {
  // ✅ ALL HOOKS MUST BE CALLED FIRST, UNCONDITIONALLY
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])
  
  // ✅ Early returns AFTER all hooks
  if (!isOpen) {
    return null
  }
  
  // Ensure we're in browser environment
  if (typeof window === 'undefined') {
    return null
  }
  
  // Render directly to document.body - escapes any container constraints
  return createPortal(
    <div 
      className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-modal" 
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-hidden={!isOpen}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={handleClick}
    >
      {children}
    </div>,
    document.body
  )
})

export { ModalPortal }
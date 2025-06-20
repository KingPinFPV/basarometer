'use client'

import React from 'react'
import { createPortal } from 'react-dom'

interface ModalPortalProps {
  children: React.ReactNode
  isOpen: boolean
}

export function ModalPortal({ children, isOpen }: ModalPortalProps) {
  console.log('🚪 ModalPortal render - isOpen:', isOpen)
  
  // Don't render anything if modal is closed
  if (!isOpen) {
    console.log('❌ Modal is closed, not rendering')
    return null
  }
  
  // Ensure we're in browser environment
  if (typeof window === 'undefined') {
    console.log('❌ Window undefined, not rendering modal')
    return null
  }
  
  console.log('✅ Rendering modal via createPortal to document.body')
  
  // Render directly to document.body - escapes any container constraints
  return createPortal(
    <div 
      className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50" 
      dir="rtl"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={(e) => {
        console.log('🖱️ Modal overlay clicked')
        e.stopPropagation()
      }}
    >
      {children}
    </div>,
    document.body
  )
}
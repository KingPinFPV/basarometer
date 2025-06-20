'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

export default function StandaloneModalTest() {
  const [isOpen, setIsOpen] = useState(false)

  const modal = isOpen && typeof window !== 'undefined' ? createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
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
      onClick={() => {
        console.log('🖱️ Standalone modal overlay clicked')
        setIsOpen(false)
      }}
    >
      <div 
        className="bg-white p-6 rounded-lg max-w-md w-full mx-4"
        style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          maxWidth: '400px',
          width: '100%',
          margin: '0 16px',
          position: 'relative',
          zIndex: 10000
        }}
        onClick={(e) => {
          console.log('🎯 Standalone modal content clicked')
          e.stopPropagation()
        }}
      >
        <h2 className="text-xl font-bold mb-4 text-black">Standalone Modal Works!</h2>
        <p className="mb-4 text-gray-700">This modal bypasses all components and uses direct createPortal.</p>
        <p className="mb-4 text-sm text-gray-600">If this shows, the modal system itself works.</p>
        <button
          onClick={() => {
            console.log('🔒 Closing standalone modal')
            setIsOpen(false)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors w-full"
        >
          Close Standalone Modal
        </button>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => {
          console.log('🧪 Standalone modal button clicked!')
          console.log('🔄 Current state:', isOpen)
          setIsOpen(true)
          console.log('✅ Standalone modal should open - new state:', true)
        }}
        className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors"
      >
        Standalone Modal
      </button>
      {modal}
    </div>
  )
}
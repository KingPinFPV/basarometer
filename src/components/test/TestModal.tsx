'use client'

import { useState } from 'react'

export default function TestModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed top-4 left-4 z-50">
      <button
        onClick={() => {
          console.log('🧪 Test button clicked!')
          console.log('🔄 Current state:', isOpen)
          setIsOpen(true)
          console.log('✅ Test modal should open - new state:', true)
        }}
        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
      >
        Test Modal
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Test Modal Works!</h2>
            <p className="mb-4">If you see this, modal system is working.</p>
            <p className="mb-4 text-sm text-gray-600">State: {isOpen ? 'OPEN' : 'CLOSED'}</p>
            <button
              onClick={() => {
                console.log('🔒 Closing test modal')
                setIsOpen(false)
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Close Test Modal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
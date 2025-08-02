'use client'

import React from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { ModalPortal } from './ModalPortal'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'אישור',
  cancelText = 'ביטול',
  variant = 'default'
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const getVariantStyles = () => {
    if (variant === 'danger') {
      return {
        icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
        confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white',
        iconBgClass: 'bg-red-100'
      }
    }
    return {
      icon: <AlertTriangle className="w-6 h-6 text-blue-500" />,
      confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
      iconBgClass: 'bg-blue-100'
    }
  }

  const { icon, confirmButtonClass, iconBgClass } = getVariantStyles()

  return (
    <ModalPortal isOpen={isOpen}>
      <div onClick={handleBackdropClick} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div 
          className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className={`p-2 rounded-full ${iconBgClass}`}>
                {icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-600 leading-relaxed">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 space-x-reverse p-6 bg-gray-50 rounded-b-lg">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${confirmButtonClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}